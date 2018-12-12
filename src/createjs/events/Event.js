this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Event (type, bubbles, cancelable) {


        this.type = type;


        this.target = null;


        this.currentTarget = null;


        this.eventPhase = 0;


        this.bubbles = !!bubbles;


        this.cancelable = !!cancelable;


        this.timeStamp = (new Date()).getTime();


        this.defaultPrevented = false;


        this.propagationStopped = false;


        this.immediatePropagationStopped = false;


        this.removed = false;
    }

    var p = Event.prototype;


    p.preventDefault = function () {
        this.defaultPrevented = this.cancelable && true;
    };


    p.stopPropagation = function () {
        this.propagationStopped = true;
    };


    p.stopImmediatePropagation = function () {
        this.immediatePropagationStopped = this.propagationStopped = true;
    };


    p.remove = function () {
        this.removed = true;
    };


    p.clone = function () {
        return new Event(this.type, this.bubbles, this.cancelable);
    };


    p.set = function (props) {
        for (var n in props) {
            this[n] = props[n];
        }
        return this;
    };


    p.toString = function () {
        return '[Event (type=' + this.type + ')]';
    };

    createjs.Event = Event;
}());
