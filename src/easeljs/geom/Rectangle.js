this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Rectangle (x, y, width, height) {
        this.setValues(x, y, width, height);


    }

    var p = Rectangle.prototype;


    p.setValues = function (x, y, width, height) {

        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
        return this;
    };


    p.extend = function (x, y, width, height) {
        width = width || 0;
        height = height || 0;
        if (x + width > this.x + this.width) {
            this.width = x + width - this.x;
        }
        if (y + height > this.y + this.height) {
            this.height = y + height - this.y;
        }
        if (x < this.x) {
            this.width += this.x - x;
            this.x = x;
        }
        if (y < this.y) {
            this.height += this.y - y;
            this.y = y;
        }
        return this;
    };


    p.pad = function (top, left, bottom, right) {
        this.x -= left;
        this.y -= top;
        this.width += left + right;
        this.height += top + bottom;
        return this;
    };


    p.copy = function (rectangle) {
        return this.setValues(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    };


    p.contains = function (x, y, width, height) {
        width = width || 0;
        height = height || 0;
        return (x >= this.x && x + width <= this.x + this.width && y >= this.y && y + height <= this.y + this.height);
    };


    p.union = function (rect) {
        return this.clone().extend(rect.x, rect.y, rect.width, rect.height);
    };


    p.intersection = function (rect) {
        var x1 = rect.x, y1 = rect.y, x2 = x1 + rect.width, y2 = y1 + rect.height;
        if (this.x > x1) {
            x1 = this.x;
        }
        if (this.y > y1) {
            y1 = this.y;
        }
        if (this.x + this.width < x2) {
            x2 = this.x + this.width;
        }
        if (this.y + this.height < y2) {
            y2 = this.y + this.height;
        }
        return (x2 <= x1 || y2 <= y1) ? null : new Rectangle(x1, y1, x2 - x1, y2 - y1);
    };


    p.intersects = function (rect) {
        return (rect.x <= this.x + this.width && this.x <= rect.x + rect.width && rect.y <= this.y + this.height && this.y <= rect.y + rect.height);
    };


    p.isEmpty = function () {
        return this.width <= 0 || this.height <= 0;
    };


    p.clone = function () {
        return new Rectangle(this.x, this.y, this.width, this.height);
    };


    p.toString = function () {
        return '[Rectangle (x=' + this.x + ' y=' + this.y + ' width=' + this.width + ' height=' + this.height + ')]';
    };


    createjs.Rectangle = Rectangle;
}());
