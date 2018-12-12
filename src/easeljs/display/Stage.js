this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Stage (canvas) {
        this.Container_constructor();


        this.autoClear = true;


        this.canvas = (typeof canvas == 'string') ? document.getElementById(canvas) : canvas;


        this.mouseX = 0;


        this.mouseY = 0;


        this.drawRect = null;


        this.snapToPixelEnabled = false;


        this.mouseInBounds = false;


        this.tickOnUpdate = true;


        this.mouseMoveOutside = false;


        this.preventSelection = true;


        this._pointerData = {};


        this._pointerCount = 0;


        this._primaryPointerID = null;


        this._mouseOverIntervalID = null;


        this._nextStage = null;


        this._prevStage = null;


        this.enableDOMEvents(true);
    }

    var p = createjs.extend(Stage, createjs.Container);


    p._get_nextStage = function () {
        return this._nextStage;
    };
    p._set_nextStage = function (value) {
        if (this._nextStage) {
            this._nextStage._prevStage = null;
        }
        if (value) {
            value._prevStage = this;
        }
        this._nextStage = value;
    };

    try {
        Object.defineProperties(p, {
            nextStage: { get: p._get_nextStage, set: p._set_nextStage },
        });
    } catch (e) {
    }


    p.update = function (props) {
        if (!this.canvas) {
            return;
        }
        if (this.tickOnUpdate) {
            this.tick(props);
        }
        if (this.dispatchEvent('drawstart', false, true) === false) {
            return;
        }
        createjs.DisplayObject._snapToPixelEnabled = this.snapToPixelEnabled;
        var r = this.drawRect, ctx = this.canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (this.autoClear) {
            if (r) {
                ctx.clearRect(r.x, r.y, r.width, r.height);
            }
            else {
                ctx.clearRect(0, 0, this.canvas.width + 1, this.canvas.height + 1);
            }
        }
        ctx.save();
        if (this.drawRect) {
            ctx.beginPath();
            ctx.rect(r.x, r.y, r.width, r.height);
            ctx.clip();
        }
        this.updateContext(ctx);
        this.draw(ctx, false);
        ctx.restore();
        this.dispatchEvent('drawend');
    };


    p.draw = function (ctx, ignoreCache) {
        var result = this.Container_draw(ctx, ignoreCache);
        this.canvas._invalid = true;
        return result;
    };


    p.tick = function (props) {
        if (!this.tickEnabled || this.dispatchEvent('tickstart', false, true) === false) {
            return;
        }
        var evtObj = new createjs.Event('tick');
        if (props) {
            for (var n in props) {
                if (props.hasOwnProperty(n)) {
                    evtObj[n] = props[n];
                }
            }
        }
        this._tick(evtObj);
        this.dispatchEvent('tickend');
    };


    p.handleEvent = function (evt) {
        if (evt.type == 'tick') {
            this.update(evt);
        }
    };


    p.clear = function () {
        if (!this.canvas) {
            return;
        }
        var ctx = this.canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width + 1, this.canvas.height + 1);
    };


    p.toDataURL = function (backgroundColor, mimeType) {
        var data, ctx = this.canvas.getContext('2d'), w = this.canvas.width, h = this.canvas.height;

        if (backgroundColor) {
            data = ctx.getImageData(0, 0, w, h);
            var compositeOperation = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'destination-over';

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, w, h);
        }

        var dataURL = this.canvas.toDataURL(mimeType || 'image/png');

        if (backgroundColor) {
            ctx.putImageData(data, 0, 0);
            ctx.globalCompositeOperation = compositeOperation;
        }

        return dataURL;
    };


    p.enableMouseOver = function (frequency) {
        if (this._mouseOverIntervalID) {
            clearInterval(this._mouseOverIntervalID);
            this._mouseOverIntervalID = null;
            if (frequency == 0) {
                this._testMouseOver(true);
            }
        }
        if (frequency == null) {
            frequency = 20;
        }
        else if (frequency <= 0) {
            return;
        }
        var o = this;
        this._mouseOverIntervalID = setInterval(function () { o._testMouseOver(); }, 1000 / Math.min(50, frequency));
    };


    p.enableDOMEvents = function (enable) {
        if (enable == null) {
            enable = true;
        }
        var n, o, ls = this._eventListeners;
        if (!enable && ls) {
            for (n in ls) {
                o = ls[n];
                o.t.removeEventListener(n, o.f, false);
            }
            this._eventListeners = null;
        } else if (enable && !ls && this.canvas) {
            var t = window.addEventListener ? window : document;
            var _this = this;
            ls = this._eventListeners = {};
            ls['mouseup'] = { t: t, f: function (e) { _this._handleMouseUp(e);} };
            ls['mousemove'] = { t: t, f: function (e) { _this._handleMouseMove(e);} };
            ls['dblclick'] = { t: this.canvas, f: function (e) { _this._handleDoubleClick(e);} };
            ls['mousedown'] = { t: this.canvas, f: function (e) { _this._handleMouseDown(e);} };

            for (n in ls) {
                o = ls[n];
                o.t.addEventListener(n, o.f, false);
            }
        }
    };


    p.clone = function () {
        throw('Stage cannot be cloned.');
    };


    p.toString = function () {
        return '[Stage (name=' + this.name + ')]';
    };


    p._getElementRect = function (e) {
        var bounds;
        try {
            bounds = e.getBoundingClientRect();
        }
        catch (err) {
            bounds = { top: e.offsetTop, left: e.offsetLeft, width: e.offsetWidth, height: e.offsetHeight };
        }

        var offX = (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || document.body.clientLeft || 0);
        var offY = (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || document.body.clientTop || 0);

        var styles = window.getComputedStyle ? getComputedStyle(e, null) : e.currentStyle;
        var padL = parseInt(styles.paddingLeft) + parseInt(styles.borderLeftWidth);
        var padT = parseInt(styles.paddingTop) + parseInt(styles.borderTopWidth);
        var padR = parseInt(styles.paddingRight) + parseInt(styles.borderRightWidth);
        var padB = parseInt(styles.paddingBottom) + parseInt(styles.borderBottomWidth);


        return {
            left: bounds.left + offX + padL,
            right: bounds.right + offX - padR,
            top: bounds.top + offY + padT,
            bottom: bounds.bottom + offY - padB,
        };
    };


    p._getPointerData = function (id) {
        var data = this._pointerData[id];
        if (!data) {
            data = this._pointerData[id] = { x: 0, y: 0 };
        }
        return data;
    };


    p._handleMouseMove = function (e) {
        if (!e) {
            e = window.event;
        }
        this._handlePointerMove(-1, e, e.pageX, e.pageY);
    };


    p._handlePointerMove = function (id, e, pageX, pageY, owner) {
        if (this._prevStage && owner === undefined) {
            return;
        }
        if (!this.canvas) {
            return;
        }
        var nextStage = this._nextStage, o = this._getPointerData(id);

        var inBounds = o.inBounds;
        this._updatePointerPosition(id, e, pageX, pageY);
        if (inBounds || o.inBounds || this.mouseMoveOutside) {
            if (id === -1 && o.inBounds == !inBounds) {
                this._dispatchMouseEvent(this, (inBounds ? 'mouseleave' : 'mouseenter'), false, id, o, e);
            }

            this._dispatchMouseEvent(this, 'stagemousemove', false, id, o, e);
            this._dispatchMouseEvent(o.target, 'pressmove', true, id, o, e);
        }

        nextStage && nextStage._handlePointerMove(id, e, pageX, pageY, null);
    };


    p._updatePointerPosition = function (id, e, pageX, pageY) {
        var rect = this._getElementRect(this.canvas);
        pageX -= rect.left;
        pageY -= rect.top;

        var w = this.canvas.width;
        var h = this.canvas.height;
        pageX /= (rect.right - rect.left) / w;
        pageY /= (rect.bottom - rect.top) / h;
        var o = this._getPointerData(id);
        if (o.inBounds = (pageX >= 0 && pageY >= 0 && pageX <= w - 1 && pageY <= h - 1)) {
            o.x = pageX;
            o.y = pageY;
        } else if (this.mouseMoveOutside) {
            o.x = pageX < 0 ? 0 : (pageX > w - 1 ? w - 1 : pageX);
            o.y = pageY < 0 ? 0 : (pageY > h - 1 ? h - 1 : pageY);
        }

        o.posEvtObj = e;
        o.rawX = pageX;
        o.rawY = pageY;

        if (id === this._primaryPointerID || id === -1) {
            this.mouseX = o.x;
            this.mouseY = o.y;
            this.mouseInBounds = o.inBounds;
        }
    };


    p._handleMouseUp = function (e) {
        this._handlePointerUp(-1, e, false);
    };


    p._handlePointerUp = function (id, e, clear, owner) {
        var nextStage = this._nextStage, o = this._getPointerData(id);
        if (this._prevStage && owner === undefined) {
            return;
        }

        var target = null, oTarget = o.target;
        if (!owner && (oTarget || nextStage)) {
            target = this._getObjectsUnderPoint(o.x, o.y, null, true);
        }

        if (o.down) {
            this._dispatchMouseEvent(this, 'stagemouseup', false, id, o, e, target);
            o.down = false;
        }

        if (target == oTarget) {
            this._dispatchMouseEvent(oTarget, 'click', true, id, o, e);
        }
        this._dispatchMouseEvent(oTarget, 'pressup', true, id, o, e);

        if (clear) {
            if (id == this._primaryPointerID) {
                this._primaryPointerID = null;
            }
            delete(this._pointerData[id]);
        } else {
            o.target = null;
        }

        nextStage && nextStage._handlePointerUp(id, e, clear, owner || target && this);
    };


    p._handleMouseDown = function (e) {
        this._handlePointerDown(-1, e, e.pageX, e.pageY);
    };


    p._handlePointerDown = function (id, e, pageX, pageY, owner) {
        if (this.preventSelection) {
            e.preventDefault();
        }
        if (this._primaryPointerID == null || id === -1) {
            this._primaryPointerID = id;
        }

        if (pageY != null) {
            this._updatePointerPosition(id, e, pageX, pageY);
        }
        var target = null, nextStage = this._nextStage, o = this._getPointerData(id);
        if (!owner) {
            target = o.target = this._getObjectsUnderPoint(o.x, o.y, null, true);
        }

        if (o.inBounds) {
            this._dispatchMouseEvent(this, 'stagemousedown', false, id, o, e, target);
            o.down = true;
        }
        this._dispatchMouseEvent(target, 'mousedown', true, id, o, e);

        nextStage && nextStage._handlePointerDown(id, e, pageX, pageY, owner || target && this);
    };


    p._testMouseOver = function (clear, owner, eventTarget) {
        if (this._prevStage && owner === undefined) {
            return;
        }

        var nextStage = this._nextStage;
        if (!this._mouseOverIntervalID) {

            nextStage && nextStage._testMouseOver(clear, owner, eventTarget);
            return;
        }
        var o = this._getPointerData(-1);

        if (!o || (!clear && this.mouseX == this._mouseOverX && this.mouseY == this._mouseOverY && this.mouseInBounds)) {
            return;
        }

        var e = o.posEvtObj;
        var isEventTarget = eventTarget || e && (e.target == this.canvas);
        var target = null, common = -1, cursor = '', t, i, l;

        if (!owner && (clear || this.mouseInBounds && isEventTarget)) {
            target = this._getObjectsUnderPoint(this.mouseX, this.mouseY, null, true);
            this._mouseOverX = this.mouseX;
            this._mouseOverY = this.mouseY;
        }

        var oldList = this._mouseOverTarget || [];
        var oldTarget = oldList[oldList.length - 1];
        var list = this._mouseOverTarget = [];


        t = target;
        while (t) {
            list.unshift(t);
            if (!cursor) {
                cursor = t.cursor;
            }
            t = t.parent;
        }
        this.canvas.style.cursor = cursor;
        if (!owner && eventTarget) {
            eventTarget.canvas.style.cursor = cursor;
        }


        for (i = 0, l = list.length; i < l; i++) {
            if (list[i] != oldList[i]) {
                break;
            }
            common = i;
        }

        if (oldTarget != target) {
            this._dispatchMouseEvent(oldTarget, 'mouseout', true, -1, o, e, target);
        }

        for (i = oldList.length - 1; i > common; i--) {
            this._dispatchMouseEvent(oldList[i], 'rollout', false, -1, o, e, target);
        }

        for (i = list.length - 1; i > common; i--) {
            this._dispatchMouseEvent(list[i], 'rollover', false, -1, o, e, oldTarget);
        }

        if (oldTarget != target) {
            this._dispatchMouseEvent(target, 'mouseover', true, -1, o, e, oldTarget);
        }

        nextStage && nextStage._testMouseOver(clear, owner || target && this, eventTarget || isEventTarget && this);
    };


    p._handleDoubleClick = function (e, owner) {
        var target = null, nextStage = this._nextStage, o = this._getPointerData(-1);
        if (!owner) {
            target = this._getObjectsUnderPoint(o.x, o.y, null, true);
            this._dispatchMouseEvent(target, 'dblclick', true, -1, o, e);
        }
        nextStage && nextStage._handleDoubleClick(e, owner || target && this);
    };


    p._dispatchMouseEvent = function (target, type, bubbles, pointerId, o, nativeEvent, relatedTarget) {

        if (!target || (!bubbles && !target.hasEventListener(type))) {
            return;
        }

        var evt = new createjs.MouseEvent(type, bubbles, false, o.x, o.y, nativeEvent, pointerId, pointerId === this._primaryPointerID || pointerId === -1, o.rawX, o.rawY, relatedTarget);
        target.dispatchEvent(evt);
    };


    createjs.Stage = createjs.promote(Stage, 'Container');
}());
