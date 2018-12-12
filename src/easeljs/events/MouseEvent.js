this.createjs = this.createjs || {};

(function () {
    'use strict';


    function MouseEvent (type, bubbles, cancelable, stageX, stageY, nativeEvent, pointerID, primary, rawX, rawY, relatedTarget) {
        this.Event_constructor(type, bubbles, cancelable);


        this.stageX = stageX;


        this.stageY = stageY;


        this.rawX = (rawX == null) ? stageX : rawX;


        this.rawY = (rawY == null) ? stageY : rawY;


        this.nativeEvent = nativeEvent;


        this.pointerID = pointerID;


        this.primary = !!primary;


        this.relatedTarget = relatedTarget;
    }

    var p = createjs.extend(MouseEvent, createjs.Event);


    p._get_localX = function () {
        return this.currentTarget.globalToLocal(this.rawX, this.rawY).x;
    };


    p._get_localY = function () {
        return this.currentTarget.globalToLocal(this.rawX, this.rawY).y;
    };


    p._get_isTouch = function () {
        return this.pointerID !== -1;
    };


    try {
        Object.defineProperties(p, {
            localX: { get: p._get_localX },
            localY: { get: p._get_localY },
            isTouch: { get: p._get_isTouch },
        });
    } catch (e) {
    }


    p.clone = function () {
        return new MouseEvent(this.type, this.bubbles, this.cancelable, this.stageX, this.stageY, this.nativeEvent, this.pointerID, this.primary, this.rawX, this.rawY);
    };


    p.toString = function () {
        return '[MouseEvent (type=' + this.type + ' stageX=' + this.stageX + ' stageY=' + this.stageY + ')]';
    };


    createjs.MouseEvent = createjs.promote(MouseEvent, 'Event');
}());
