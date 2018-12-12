this.createjs = this.createjs || {};

(function () {
    'use strict';


    function EventDispatcher () {


        this._listeners = null;


        this._captureListeners = null;
    }

    var p = EventDispatcher.prototype;


    EventDispatcher.initialize = function (target) {
        target.addEventListener = p.addEventListener;
        target.on = p.on;
        target.removeEventListener = target.off = p.removeEventListener;
        target.removeAllEventListeners = p.removeAllEventListeners;
        target.hasEventListener = p.hasEventListener;
        target.dispatchEvent = p.dispatchEvent;
        target._dispatchEvent = p._dispatchEvent;
        target.willTrigger = p.willTrigger;
    };


    p.addEventListener = function (type, listener, useCapture) {
        var listeners;
        if (useCapture) {
            listeners = this._captureListeners = this._captureListeners || {};
        } else {
            listeners = this._listeners = this._listeners || {};
        }
        var arr = listeners[type];
        if (arr) {
            this.removeEventListener(type, listener, useCapture);
        }
        arr = listeners[type];
        if (!arr) {
            listeners[type] = [listener];
        }
        else {
            arr.push(listener);
        }
        return listener;
    };


    p.on = function (type, listener, scope, once, data, useCapture) {
        if (listener.handleEvent) {
            scope = scope || listener;
            listener = listener.handleEvent;
        }
        scope = scope || this;
        return this.addEventListener(type, function (evt) {
            listener.call(scope, evt, data);
            once && evt.remove();
        }, useCapture);
    };


    p.removeEventListener = function (type, listener, useCapture) {
        var listeners = useCapture ? this._captureListeners : this._listeners;
        if (!listeners) {
            return;
        }
        var arr = listeners[type];
        if (!arr) {
            return;
        }
        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i] == listener) {
                if (l == 1) {
                    delete(listeners[type]);
                }
                else {
                    arr.splice(i, 1);
                }
                break;
            }
        }
    };


    p.off = p.removeEventListener;


    p.removeAllEventListeners = function (type) {
        if (!type) {
            this._listeners = this._captureListeners = null;
        }
        else {
            if (this._listeners) {
                delete(this._listeners[type]);
            }
            if (this._captureListeners) {
                delete(this._captureListeners[type]);
            }
        }
    };


    p.dispatchEvent = function (eventObj, bubbles, cancelable) {
        if (typeof eventObj == 'string') {

            var listeners = this._listeners;
            if (!bubbles && (!listeners || !listeners[eventObj])) {
                return true;
            }
            eventObj = new createjs.Event(eventObj, bubbles, cancelable);
        } else if (eventObj.target && eventObj.clone) {

            eventObj = eventObj.clone();
        }


        try {
            eventObj.target = this;
        } catch (e) {
        }

        if (!eventObj.bubbles || !this.parent) {
            this._dispatchEvent(eventObj, 2);
        } else {
            var top = this, list = [top];
            while (top.parent) {
                list.push(top = top.parent);
            }
            var i, l = list.length;


            for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
                list[i]._dispatchEvent(eventObj, 1 + (i == 0));
            }

            for (i = 1; i < l && !eventObj.propagationStopped; i++) {
                list[i]._dispatchEvent(eventObj, 3);
            }
        }
        return !eventObj.defaultPrevented;
    };


    p.hasEventListener = function (type) {
        var listeners = this._listeners, captureListeners = this._captureListeners;
        return !!((listeners && listeners[type]) || (captureListeners && captureListeners[type]));
    };


    p.willTrigger = function (type) {
        var o = this;
        while (o) {
            if (o.hasEventListener(type)) {
                return true;
            }
            o = o.parent;
        }
        return false;
    };


    p.toString = function () {
        return '[EventDispatcher]';
    };


    p._dispatchEvent = function (eventObj, eventPhase) {
        var l, arr, listeners = (eventPhase <= 2) ? this._captureListeners : this._listeners;
        if (eventObj && listeners && (arr = listeners[eventObj.type]) && (l = arr.length)) {
            try {
                eventObj.currentTarget = this;
            } catch (e) {
            }
            try {
                eventObj.eventPhase = eventPhase | 0;
            } catch (e) {
            }
            eventObj.removed = false;

            arr = arr.slice();
            for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
                var o = arr[i];
                if (o.handleEvent) {
                    o.handleEvent(eventObj);
                }
                else {
                    o(eventObj);
                }
                if (eventObj.removed) {
                    this.off(eventObj.type, o, eventPhase == 1);
                    eventObj.removed = false;
                }
            }
        }
        if (eventPhase === 2) {
            this._dispatchEvent(eventObj, 2.1);
        }
    };


    createjs.EventDispatcher = EventDispatcher;
}());
