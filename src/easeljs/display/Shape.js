this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Shape (graphics) {
        this.DisplayObject_constructor();


        this.graphics = graphics ? graphics : new createjs.Graphics();
    }

    var p = createjs.extend(Shape, createjs.DisplayObject);


    p.isVisible = function () {
        var hasContent = this.cacheCanvas || (this.graphics && !this.graphics.isEmpty());
        return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
    };


    p.draw = function (ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return true;
        }
        this.graphics.draw(ctx, this);
        return true;
    };


    p.clone = function (recursive) {
        var g = (recursive && this.graphics) ? this.graphics.clone() : this.graphics;
        return this._cloneProps(new Shape(g));
    };


    p.toString = function () {
        return '[Shape (name=' + this.name + ')]';
    };


    createjs.Shape = createjs.promote(Shape, 'DisplayObject');
}());
