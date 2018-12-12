this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Filter () {

        this.usesContext = false;


        this._multiPass = null;


        this.VTX_SHADER_BODY = null;


        this.FRAG_SHADER_BODY = null;
    }

    var p = Filter.prototype;


    Filter.isValidImageSource = function (src) {
        return Boolean(src) && (
            src instanceof Image ||
            src instanceof WebGLTexture ||
            src instanceof HTMLCanvasElement
        );
    };


    p.getBounds = function (rect) {
        return rect;
    };


    p.shaderParamSetup = function (gl, stage, shaderProgram) {};


    p.applyFilter = function (ctx, x, y, width, height, targetCtx) {

        targetCtx = targetCtx || ctx;
        try {
            var imageData = ctx.getImageData(x, y, width, height);
        } catch (e) {
            return false;
        }
        if (this._applyFilter(imageData)) {
            targetCtx.putImageData(imageData, x, y);
            return true;
        }
        return false;
    };


    p.toString = function () {
        return '[Filter]';
    };


    p.clone = function () {
        return new Filter();
    };


    p._applyFilter = function (imageData) { return true; };


    createjs.Filter = Filter;
}());
