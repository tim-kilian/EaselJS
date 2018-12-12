this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Touch () {
        throw 'Touch cannot be instantiated';
    }


    Touch.isSupported = function () {
        return !!(('ontouchstart' in window)
            || (window.MSPointerEvent && window.navigator.msMaxTouchPoints > 0)
            || (window.PointerEvent && window.navigator.maxTouchPoints > 0));
    };


    Touch.enable = function (stage, singleTouch, allowDefault) {
        if (!stage || !stage.canvas || !Touch.isSupported()) {
            return false;
        }
        if (stage.__touch) {
            return true;
        }


        stage.__touch = { pointers: {}, multitouch: !singleTouch, preventDefault: !allowDefault, count: 0 };


        if ('ontouchstart' in window) {
            Touch._IOS_enable(stage);
        }
        else if (window.PointerEvent || window.MSPointerEvent) {
            Touch._IE_enable(stage);
        }
        return true;
    };


    Touch.disable = function (stage) {
        if (!stage) {
            return;
        }
        if ('ontouchstart' in window) {
            Touch._IOS_disable(stage);
        }
        else if (window.PointerEvent || window.MSPointerEvent) {
            Touch._IE_disable(stage);
        }

        delete stage.__touch;
    };


    Touch._IOS_enable = function (stage) {
        var canvas = stage.canvas;
        var f = stage.__touch.f = function (e) { Touch._IOS_handleEvent(stage, e); };
        canvas.addEventListener('touchstart', f, false);
        canvas.addEventListener('touchmove', f, false);
        canvas.addEventListener('touchend', f, false);
        canvas.addEventListener('touchcancel', f, false);
    };


    Touch._IOS_disable = function (stage) {
        var canvas = stage.canvas;
        if (!canvas) {
            return;
        }
        var f = stage.__touch.f;
        canvas.removeEventListener('touchstart', f, false);
        canvas.removeEventListener('touchmove', f, false);
        canvas.removeEventListener('touchend', f, false);
        canvas.removeEventListener('touchcancel', f, false);
    };


    Touch._IOS_handleEvent = function (stage, e) {
        if (!stage) {
            return;
        }
        if (stage.__touch.preventDefault) {
            e.preventDefault && e.preventDefault();
        }
        var touches = e.changedTouches;
        var type = e.type;
        for (var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            if (touch.target != stage.canvas) {
                continue;
            }

            if (type === 'touchstart') {
                this._handleStart(stage, id, e, touch.pageX, touch.pageY);
            } else if (type === 'touchmove') {
                this._handleMove(stage, id, e, touch.pageX, touch.pageY);
            } else if (type === 'touchend' || type === 'touchcancel') {
                this._handleEnd(stage, id, e);
            }
        }
    };


    Touch._IE_enable = function (stage) {
        var canvas = stage.canvas;
        var f = stage.__touch.f = function (e) { Touch._IE_handleEvent(stage, e); };

        if (window.PointerEvent === undefined) {
            canvas.addEventListener('MSPointerDown', f, false);
            window.addEventListener('MSPointerMove', f, false);
            window.addEventListener('MSPointerUp', f, false);
            window.addEventListener('MSPointerCancel', f, false);
            if (stage.__touch.preventDefault) {
                canvas.style.msTouchAction = 'none';
            }
        } else {
            canvas.addEventListener('pointerdown', f, false);
            window.addEventListener('pointermove', f, false);
            window.addEventListener('pointerup', f, false);
            window.addEventListener('pointercancel', f, false);
            if (stage.__touch.preventDefault) {
                canvas.style.touchAction = 'none';
            }

        }
        stage.__touch.activeIDs = {};
    };


    Touch._IE_disable = function (stage) {
        var f = stage.__touch.f;

        if (window.PointerEvent === undefined) {
            window.removeEventListener('MSPointerMove', f, false);
            window.removeEventListener('MSPointerUp', f, false);
            window.removeEventListener('MSPointerCancel', f, false);
            if (stage.canvas) {
                stage.canvas.removeEventListener('MSPointerDown', f, false);
            }
        } else {
            window.removeEventListener('pointermove', f, false);
            window.removeEventListener('pointerup', f, false);
            window.removeEventListener('pointercancel', f, false);
            if (stage.canvas) {
                stage.canvas.removeEventListener('pointerdown', f, false);
            }
        }
    };


    Touch._IE_handleEvent = function (stage, e) {
        if (!stage) {
            return;
        }
        if (stage.__touch.preventDefault) {
            e.preventDefault && e.preventDefault();
        }
        var type = e.type;
        var id = e.pointerId;
        var ids = stage.__touch.activeIDs;

        if (type === 'MSPointerDown' || type === 'pointerdown') {
            if (e.srcElement != stage.canvas) {
                return;
            }
            ids[id] = true;
            this._handleStart(stage, id, e, e.pageX, e.pageY);
        } else if (ids[id]) {
            if (type === 'MSPointerMove' || type === 'pointermove') {
                this._handleMove(stage, id, e, e.pageX, e.pageY);
            } else if (type === 'MSPointerUp' || type === 'MSPointerCancel'
                || type === 'pointerup' || type === 'pointercancel') {
                delete(ids[id]);
                this._handleEnd(stage, id, e);
            }
        }
    };


    Touch._handleStart = function (stage, id, e, x, y) {
        var props = stage.__touch;
        if (!props.multitouch && props.count) {
            return;
        }
        var ids = props.pointers;
        if (ids[id]) {
            return;
        }
        ids[id] = true;
        props.count++;
        stage._handlePointerDown(id, e, x, y);
    };


    Touch._handleMove = function (stage, id, e, x, y) {
        if (!stage.__touch.pointers[id]) {
            return;
        }
        stage._handlePointerMove(id, e, x, y);
    };


    Touch._handleEnd = function (stage, id, e) {

        var props = stage.__touch;
        var ids = props.pointers;
        if (!ids[id]) {
            return;
        }
        props.count--;
        stage._handlePointerUp(id, e, true);
        delete(ids[id]);
    };


    createjs.Touch = Touch;
}());
