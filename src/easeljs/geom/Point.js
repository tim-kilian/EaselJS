this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Point (x, y) {
        this.setValues(x, y);


    }

    var p = Point.prototype;


    p.setValues = function (x, y) {
        this.x = x || 0;
        this.y = y || 0;
        return this;
    };


    p.offset = function (dx, dy) {
        this.x += dx;
        this.y += dy;
        return this;
    };


    Point.polar = function (len, angle, pt) {
        pt = pt || new Point();
        pt.x = len * Math.cos(angle);
        pt.y = len * Math.sin(angle);
        return pt;
    };


    Point.interpolate = function (pt1, pt2, f, pt) {
        pt = pt || new Point();
        pt.x = pt2.x + f * (pt1.x - pt2.x);
        pt.y = pt2.y + f * (pt1.y - pt2.y);
        return pt;
    };


    p.copy = function (point) {
        this.x = point.x;
        this.y = point.y;
        return this;
    };


    p.clone = function () {
        return new Point(this.x, this.y);
    };


    p.toString = function () {
        return '[Point (x=' + this.x + ' y=' + this.y + ')]';
    };


    createjs.Point = Point;
}());
