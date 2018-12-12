this.createjs = this.createjs || {};

(function () {
    'use strict';


    function ButtonHelper (target, outLabel, overLabel, downLabel, play, hitArea, hitLabel) {
        if (!target.addEventListener) {
            return;
        }


        this.target = target;


        this.overLabel = overLabel == null ? 'over' : overLabel;


        this.outLabel = outLabel == null ? 'out' : outLabel;


        this.downLabel = downLabel == null ? 'down' : downLabel;


        this.play = play;


        this._isPressed = false;


        this._isOver = false;


        this._enabled = false;


        target.mouseChildren = false;
        this.enabled = true;
        this.handleEvent({});
        if (hitArea) {
            if (hitLabel) {
                hitArea.actionsEnabled = false;
                hitArea.gotoAndStop && hitArea.gotoAndStop(hitLabel);
            }
            target.hitArea = hitArea;
        }
    }

    var p = ButtonHelper.prototype;


    p._setEnabled = function (value) {
        if (value == this._enabled) {
            return;
        }
        var o = this.target;
        this._enabled = value;
        if (value) {
            o.cursor = 'pointer';
            o.addEventListener('rollover', this);
            o.addEventListener('rollout', this);
            o.addEventListener('mousedown', this);
            o.addEventListener('pressup', this);
            if (o._reset) {
                o.__reset = o._reset;
                o._reset = this._reset;
            }
        } else {
            o.cursor = null;
            o.removeEventListener('rollover', this);
            o.removeEventListener('rollout', this);
            o.removeEventListener('mousedown', this);
            o.removeEventListener('pressup', this);
            if (o.__reset) {
                o._reset = o.__reset;
                delete(o.__reset);
            }
        }
    };


    p.setEnabled = createjs.deprecate(p._setEnabled, 'ButtonHelper.setEnabled');


    p._getEnabled = function () {
        return this._enabled;
    };


    p.getEnabled = createjs.deprecate(p._getEnabled, 'ButtonHelper.getEnabled');


    try {
        Object.defineProperties(p, {
            enabled: { get: p._getEnabled, set: p._setEnabled },
        });
    } catch (e) {
    }


    p.toString = function () {
        return '[ButtonHelper]';
    };


    p.handleEvent = function (evt) {
        var label, t = this.target, type = evt.type;
        if (type == 'mousedown') {
            this._isPressed = true;
            label = this.downLabel;
        } else if (type == 'pressup') {
            this._isPressed = false;
            label = this._isOver ? this.overLabel : this.outLabel;
        } else if (type == 'rollover') {
            this._isOver = true;
            label = this._isPressed ? this.downLabel : this.overLabel;
        } else {
            this._isOver = false;
            label = this._isPressed ? this.overLabel : this.outLabel;
        }
        if (this.play) {
            t.gotoAndPlay && t.gotoAndPlay(label);
        } else {
            t.gotoAndStop && t.gotoAndStop(label);
        }
    };


    p._reset = function () {

        var p = this.paused;
        this.__reset();
        this.paused = p;
    };


    createjs.ButtonHelper = ButtonHelper;
}());
