this.createjs = this.createjs || {};

(function () {
    'use strict';


    function DOMElement (htmlElement) {
        this.DisplayObject_constructor();

        if (typeof(htmlElement) == 'string') {
            htmlElement = document.getElementById(htmlElement);
        }
        this.mouseEnabled = false;

        var style = htmlElement.style;
        style.position = 'absolute';
        style.transformOrigin = style.WebkitTransformOrigin = style.msTransformOrigin = style.MozTransformOrigin = style.OTransformOrigin = '0% 0%';


        this.htmlElement = htmlElement;


        this._oldProps = null;


        this._oldStage = null;

        this._drawAction = null;
    }

    var p = createjs.extend(DOMElement, createjs.DisplayObject);


    p.isVisible = function () {
        return this.htmlElement != null;
    };


    p.draw = function (ctx, ignoreCache) {


        return true;
    };


    p.cache = function () {};


    p.uncache = function () {};


    p.updateCache = function () {};


    p.hitTest = function () {};


    p.localToGlobal = function () {};


    p.globalToLocal = function () {};


    p.localToLocal = function () {};


    p.clone = function () {
        throw('DOMElement cannot be cloned.');
    };


    p.toString = function () {
        return '[DOMElement (name=' + this.name + ')]';
    };


    p._tick = function (evtObj) {
        var stage = this.stage;
        if (stage && stage !== this._oldStage) {
            this._drawAction && stage.off('drawend', this._drawAction);
            this._drawAction = stage.on('drawend', this._handleDrawEnd, this);
            this._oldStage = stage;
        }
        this.DisplayObject__tick(evtObj);
    };


    p._handleDrawEnd = function (evt) {
        var o = this.htmlElement;
        if (!o) {
            return;
        }
        var style = o.style;

        var props = this.getConcatenatedDisplayProps(this._props), mtx = props.matrix;

        var visibility = props.visible ? 'visible' : 'hidden';
        if (visibility != style.visibility) {
            style.visibility = visibility;
        }
        if (!props.visible) {
            return;
        }

        var oldProps = this._oldProps, oldMtx = oldProps && oldProps.matrix;
        var n = 10000;

        if (!oldMtx || !oldMtx.equals(mtx)) {
            var str = 'matrix(' + (mtx.a * n | 0) / n + ',' + (mtx.b * n | 0) / n + ',' + (mtx.c * n | 0) / n + ',' + (mtx.d * n | 0) / n + ',' + (mtx.tx + 0.5 | 0);
            style.transform = style.WebkitTransform = style.OTransform = style.msTransform = str + ',' + (mtx.ty + 0.5 | 0) + ')';
            style.MozTransform = str + 'px,' + (mtx.ty + 0.5 | 0) + 'px)';
            if (!oldProps) {
                oldProps = this._oldProps = new createjs.DisplayProps(true, null);
            }
            oldProps.matrix.copy(mtx);
        }

        if (oldProps.alpha != props.alpha) {
            style.opacity = '' + (props.alpha * n | 0) / n;
            oldProps.alpha = props.alpha;
        }
    };


    createjs.DOMElement = createjs.promote(DOMElement, 'DisplayObject');
}());
