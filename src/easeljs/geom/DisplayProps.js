this.createjs = this.createjs || {};

(function () {
    'use strict';


    function DisplayProps (visible, alpha, shadow, compositeOperation, matrix) {
        this.setValues(visible, alpha, shadow, compositeOperation, matrix);


    }

    var p = DisplayProps.prototype;


    p.setValues = function (visible, alpha, shadow, compositeOperation, matrix) {
        this.visible = visible == null ? true : !!visible;
        this.alpha = alpha == null ? 1 : alpha;
        this.shadow = shadow;
        this.compositeOperation = compositeOperation;
        this.matrix = matrix || (this.matrix && this.matrix.identity()) || new createjs.Matrix2D();
        return this;
    };


    p.append = function (visible, alpha, shadow, compositeOperation, matrix) {
        this.alpha *= alpha;
        this.shadow = shadow || this.shadow;
        this.compositeOperation = compositeOperation || this.compositeOperation;
        this.visible = this.visible && visible;
        matrix && this.matrix.appendMatrix(matrix);
        return this;
    };


    p.prepend = function (visible, alpha, shadow, compositeOperation, matrix) {
        this.alpha *= alpha;
        this.shadow = this.shadow || shadow;
        this.compositeOperation = this.compositeOperation || compositeOperation;
        this.visible = this.visible && visible;
        matrix && this.matrix.prependMatrix(matrix);
        return this;
    };


    p.identity = function () {
        this.visible = true;
        this.alpha = 1;
        this.shadow = this.compositeOperation = null;
        this.matrix.identity();
        return this;
    };


    p.clone = function () {
        return new DisplayProps(this.alpha, this.shadow, this.compositeOperation, this.visible, this.matrix.clone());
    };


    createjs.DisplayProps = DisplayProps;
})();
