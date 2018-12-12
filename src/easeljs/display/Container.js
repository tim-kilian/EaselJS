this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Container () {
        this.DisplayObject_constructor();


        this.children = [];


        this.mouseChildren = true;


        this.tickChildren = true;
    }

    var p = createjs.extend(Container, createjs.DisplayObject);


    p._getNumChildren = function () {
        return this.children.length;
    };


    p.getNumChildren = createjs.deprecate(p._getNumChildren, 'Container.getNumChildren');


    try {
        Object.defineProperties(p, {
            numChildren: { get: p._getNumChildren },
        });
    } catch (e) {
    }


    p.initialize = Container;


    p.isVisible = function () {
        var hasContent = this.cacheCanvas || this.children.length;
        return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
    };


    p.draw = function (ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return true;
        }


        var list = this.children.slice();
        for (var i = 0, l = list.length; i < l; i++) {
            var child = list[i];
            if (!child.isVisible()) {
                continue;
            }


            ctx.save();
            child.updateContext(ctx);
            child.draw(ctx);
            ctx.restore();
        }
        return true;
    };


    p.addChild = function (child) {
        if (child == null) {
            return child;
        }
        var l = arguments.length;
        if (l > 1) {
            for (var i = 0; i < l; i++) {
                this.addChild(arguments[i]);
            }
            return arguments[l - 1];
        }

        var par = child.parent, silent = par === this;
        par && par._removeChildAt(createjs.indexOf(par.children, child), silent);
        child.parent = this;
        this.children.push(child);
        if (!silent) {
            child.dispatchEvent('added');
        }
        return child;
    };


    p.addChildAt = function (child, index) {
        var l = arguments.length;
        var indx = arguments[l - 1];
        if (indx < 0 || indx > this.children.length) {
            return arguments[l - 2];
        }
        if (l > 2) {
            for (var i = 0; i < l - 1; i++) {
                this.addChildAt(arguments[i], indx + i);
            }
            return arguments[l - 2];
        }
        var par = child.parent, silent = par === this;
        par && par._removeChildAt(createjs.indexOf(par.children, child), silent);
        child.parent = this;
        this.children.splice(index, 0, child);
        if (!silent) {
            child.dispatchEvent('added');
        }
        return child;
    };


    p.removeChild = function (child) {
        var l = arguments.length;
        if (l > 1) {
            var good = true;
            for (var i = 0; i < l; i++) {
                good = good && this.removeChild(arguments[i]);
            }
            return good;
        }
        return this._removeChildAt(createjs.indexOf(this.children, child));
    };


    p.removeChildAt = function (index) {
        var l = arguments.length;
        if (l > 1) {
            var a = [];
            for (var i = 0; i < l; i++) {
                a[i] = arguments[i];
            }
            a.sort(function (a, b) { return b - a; });
            var good = true;
            for (var i = 0; i < l; i++) {
                good = good && this._removeChildAt(a[i]);
            }
            return good;
        }
        return this._removeChildAt(index);
    };


    p.removeAllChildren = function () {
        var kids = this.children;
        while (kids.length) {
            this._removeChildAt(0);
        }
    };


    p.getChildAt = function (index) {
        return this.children[index];
    };


    p.getChildByName = function (name) {
        var kids = this.children;
        for (var i = 0, l = kids.length; i < l; i++) {
            if (kids[i].name == name) {
                return kids[i];
            }
        }
        return null;
    };


    p.sortChildren = function (sortFunction) {
        this.children.sort(sortFunction);
    };


    p.getChildIndex = function (child) {
        return createjs.indexOf(this.children, child);
    };


    p.swapChildrenAt = function (index1, index2) {
        var kids = this.children;
        var o1 = kids[index1];
        var o2 = kids[index2];
        if (!o1 || !o2) {
            return;
        }
        kids[index1] = o2;
        kids[index2] = o1;
    };


    p.swapChildren = function (child1, child2) {
        var kids = this.children;
        var index1, index2;
        for (var i = 0, l = kids.length; i < l; i++) {
            if (kids[i] == child1) {
                index1 = i;
            }
            if (kids[i] == child2) {
                index2 = i;
            }
            if (index1 != null && index2 != null) {
                break;
            }
        }
        if (i == l) {
            return;
        }
        kids[index1] = child2;
        kids[index2] = child1;
    };


    p.setChildIndex = function (child, index) {
        var kids = this.children, l = kids.length;
        if (child.parent != this || index < 0 || index >= l) {
            return;
        }
        for (var i = 0; i < l; i++) {
            if (kids[i] == child) {
                break;
            }
        }
        if (i == l || i == index) {
            return;
        }
        kids.splice(i, 1);
        kids.splice(index, 0, child);
    };


    p.contains = function (child) {
        while (child) {
            if (child == this) {
                return true;
            }
            child = child.parent;
        }
        return false;
    };


    p.hitTest = function (x, y) {

        return (this.getObjectUnderPoint(x, y) != null);
    };


    p.getObjectsUnderPoint = function (x, y, mode) {
        var arr = [];
        var pt = this.localToGlobal(x, y);
        this._getObjectsUnderPoint(pt.x, pt.y, arr, mode > 0, mode == 1);
        return arr;
    };


    p.getObjectUnderPoint = function (x, y, mode) {
        var pt = this.localToGlobal(x, y);
        return this._getObjectsUnderPoint(pt.x, pt.y, null, mode > 0, mode == 1);
    };


    p.getBounds = function () {
        return this._getBounds(null, true);
    };


    p.getTransformedBounds = function () {
        return this._getBounds();
    };


    p.clone = function (recursive) {
        var o = this._cloneProps(new Container());
        if (recursive) {
            this._cloneChildren(o);
        }
        return o;
    };


    p.toString = function () {
        return '[Container (name=' + this.name + ')]';
    };


    p._tick = function (evtObj) {
        if (this.tickChildren) {
            for (var i = this.children.length - 1; i >= 0; i--) {
                var child = this.children[i];
                if (child.tickEnabled && child._tick) {
                    child._tick(evtObj);
                }
            }
        }
        this.DisplayObject__tick(evtObj);
    };


    p._cloneChildren = function (o) {
        if (o.children.length) {
            o.removeAllChildren();
        }
        var arr = o.children;
        for (var i = 0, l = this.children.length; i < l; i++) {
            var clone = this.children[i].clone(true);
            clone.parent = o;
            arr.push(clone);
        }
    };


    p._removeChildAt = function (index, silent) {
        if (index < 0 || index > this.children.length - 1) {
            return false;
        }
        var child = this.children[index];
        if (child) {
            child.parent = null;
        }
        this.children.splice(index, 1);
        if (!silent) {
            child.dispatchEvent('removed');
        }
        return true;
    };


    p._getObjectsUnderPoint = function (x, y, arr, mouse, activeListener, currentDepth) {
        currentDepth = currentDepth || 0;
        if (!currentDepth && !this._testMask(this, x, y)) {
            return null;
        }
        var mtx, ctx = createjs.DisplayObject._hitTestContext;
        activeListener = activeListener || (mouse && this._hasMouseEventListener());


        var children = this.children, l = children.length;
        for (var i = l - 1; i >= 0; i--) {
            var child = children[i];
            var hitArea = child.hitArea;
            if (!child.visible || (!hitArea && !child.isVisible()) || (mouse && !child.mouseEnabled)) {
                continue;
            }
            if (!hitArea && !this._testMask(child, x, y)) {
                continue;
            }


            if (!hitArea && child instanceof Container) {
                var result = child._getObjectsUnderPoint(x, y, arr, mouse, activeListener, currentDepth + 1);
                if (!arr && result) {
                    return (mouse && !this.mouseChildren) ? this : result;
                }
            } else {
                if (mouse && !activeListener && !child._hasMouseEventListener()) {
                    continue;
                }


                var props = child.getConcatenatedDisplayProps(child._props);
                mtx = props.matrix;

                if (hitArea) {
                    mtx.appendMatrix(hitArea.getMatrix(hitArea._props.matrix));
                    props.alpha = hitArea.alpha;
                }

                ctx.globalAlpha = props.alpha;
                ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
                (hitArea || child).draw(ctx);
                if (!this._testHit(ctx)) {
                    continue;
                }
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, 2, 2);
                if (arr) {
                    arr.push(child);
                }
                else {
                    return (mouse && !this.mouseChildren) ? this : child;
                }
            }
        }
        return null;
    };


    p._testMask = function (target, x, y) {
        var mask = target.mask;
        if (!mask || !mask.graphics || mask.graphics.isEmpty()) {
            return true;
        }

        var mtx = this._props.matrix, parent = target.parent;
        mtx = parent ? parent.getConcatenatedMatrix(mtx) : mtx.identity();
        mtx = mask.getMatrix(mask._props.matrix).prependMatrix(mtx);

        var ctx = createjs.DisplayObject._hitTestContext;
        ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);


        mask.graphics.drawAsPath(ctx);
        ctx.fillStyle = '#000';
        ctx.fill();

        if (!this._testHit(ctx)) {
            return false;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, 2, 2);

        return true;
    };


    p._getBounds = function (matrix, ignoreTransform) {
        var bounds = this.DisplayObject_getBounds();
        if (bounds) {
            return this._transformBounds(bounds, matrix, ignoreTransform);
        }

        var mtx = this._props.matrix;
        mtx = ignoreTransform ? mtx.identity() : this.getMatrix(mtx);
        if (matrix) {
            mtx.prependMatrix(matrix);
        }

        var l = this.children.length, rect = null;
        for (var i = 0; i < l; i++) {
            var child = this.children[i];
            if (!child.visible || !(bounds = child._getBounds(mtx))) {
                continue;
            }
            if (rect) {
                rect.extend(bounds.x, bounds.y, bounds.width, bounds.height);
            }
            else {
                rect = bounds.clone();
            }
        }
        return rect;
    };


    createjs.Container = createjs.promote(Container, 'DisplayObject');
}());
