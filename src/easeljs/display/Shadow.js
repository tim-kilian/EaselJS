this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Shadow (color, offsetX, offsetY, blur) {


        this.color = color || 'black';


        this.offsetX = offsetX || 0;


        this.offsetY = offsetY || 0;


        this.blur = blur || 0;
    }

    var p = Shadow.prototype;


    Shadow.identity = new Shadow('transparent', 0, 0, 0);


    p.toString = function () {
        return '[Shadow]';
    };


    p.clone = function () {
        return new Shadow(this.color, this.offsetX, this.offsetY, this.blur);
    };


    createjs.Shadow = Shadow;
}());
