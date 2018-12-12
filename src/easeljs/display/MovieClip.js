this.createjs = this.createjs || {};

(function () {
    'use strict';


    function MovieClip (props) {
        this.Container_constructor();
        !MovieClip.inited && MovieClip.init();

        var mode, startPosition, loop, labels;


        if (props instanceof String || arguments.length > 1) {
            mode = props;
            startPosition = arguments[1];
            loop = arguments[2];
            labels = arguments[3];
            if (loop == null) {
                loop = -1;
            }
            props = null;
        } else if (props) {
            mode = props.mode;
            startPosition = props.startPosition;
            loop = props.loop;
            labels = props.labels;
        }
        if (!props) {
            props = { labels: labels };
        }


        this.mode = mode || MovieClip.INDEPENDENT;


        this.startPosition = startPosition || 0;


        this.loop = loop === true ? -1 : (loop || 0);


        this.currentFrame = 0;


        this.paused = props.paused || false;


        this.actionsEnabled = true;


        this.autoReset = true;


        this.frameBounds = this.frameBounds || props.frameBounds;


        this.framerate = null;


        props.useTicks = props.paused = true;


        this.timeline = new createjs.Timeline(props);


        this._synchOffset = 0;


        this._rawPosition = -1;


        this._bound_resolveState = this._resolveState.bind(this);


        this._t = 0;


        this._managed = {};
    }

    var p = createjs.extend(MovieClip, createjs.Container);


    MovieClip.INDEPENDENT = 'independent';


    MovieClip.SINGLE_FRAME = 'single';


    MovieClip.SYNCHED = 'synched';


    MovieClip.inited = false;


    MovieClip.init = function () {
        if (MovieClip.inited) {
            return;
        }

        MovieClipPlugin.install();
        MovieClip.inited = true;
    };


    p._getLabels = function () {
        return this.timeline.getLabels();
    };


    p.getLabels = createjs.deprecate(p._getLabels, 'MovieClip.getLabels');


    p._getCurrentLabel = function () {
        return this.timeline.currentLabel;
    };


    p.getCurrentLabel = createjs.deprecate(p._getCurrentLabel, 'MovieClip.getCurrentLabel');


    p._getDuration = function () {
        return this.timeline.duration;
    };


    p.getDuration = createjs.deprecate(p._getDuration, 'MovieClip.getDuration');


    try {
        Object.defineProperties(p, {
            labels: { get: p._getLabels },
            currentLabel: { get: p._getCurrentLabel },
            totalFrames: { get: p._getDuration },
            duration: { get: p._getDuration },

        });
    } catch (e) {
    }


    p.initialize = MovieClip;


    p.isVisible = function () {

        return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0);
    };


    p.draw = function (ctx, ignoreCache) {

        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return true;
        }
        this._updateState();
        this.Container_draw(ctx, ignoreCache);
        return true;
    };


    p.play = function () {
        this.paused = false;
    };


    p.stop = function () {
        this.paused = true;
    };


    p.gotoAndPlay = function (positionOrLabel) {
        this.paused = false;
        this._goto(positionOrLabel);
    };


    p.gotoAndStop = function (positionOrLabel) {
        this.paused = true;
        this._goto(positionOrLabel);
    };


    p.advance = function (time) {
        var independent = MovieClip.INDEPENDENT;
        if (this.mode !== independent) {
            return;
        }


        var o = this, fps = o.framerate;
        while ((o = o.parent) && fps === null) {
            if (o.mode === independent) {
                fps = o._framerate;
            }
        }
        this._framerate = fps;


        var t = (fps !== null && fps !== -1 && time !== null) ? time / (1000 / fps) + this._t : 1;
        var frames = t | 0;
        this._t = t - frames;

        while (!this.paused && frames--) {
            this._updateTimeline(this._rawPosition + 1, false);
        }
    };


    p.clone = function () {

        throw('MovieClip cannot be cloned.');
    };


    p.toString = function () {
        return '[MovieClip (name=' + this.name + ')]';
    };


    p._updateState = function () {
        if (this._rawPosition === -1 || this.mode !== MovieClip.INDEPENDENT) {
            this._updateTimeline(-1);
        }
    };


    p._tick = function (evtObj) {
        this.advance(evtObj && evtObj.delta);
        this.Container__tick(evtObj);
    };


    p._goto = function (positionOrLabel) {
        var pos = this.timeline.resolve(positionOrLabel);
        if (pos == null) {
            return;
        }
        this._t = 0;
        this._updateTimeline(pos, true);
    };


    p._reset = function () {
        this._rawPosition = -1;
        this._t = this.currentFrame = 0;
        this.paused = false;
    };


    p._updateTimeline = function (rawPosition, jump) {
        var synced = this.mode !== MovieClip.INDEPENDENT, tl = this.timeline;
        if (synced) {
            rawPosition = this.startPosition + (this.mode === MovieClip.SINGLE_FRAME ? 0 : this._synchOffset);
        }
        if (rawPosition < 0) {
            rawPosition = 0;
        }
        if (this._rawPosition === rawPosition && !synced) {
            return;
        }
        this._rawPosition = rawPosition;


        tl.loop = this.loop;
        tl.setPosition(rawPosition, synced || !this.actionsEnabled, jump, this._bound_resolveState);
    };


    p._renderFirstFrame = function () {
        var tl = this.timeline, pos = tl.rawPosition;
        tl.setPosition(0, true, true, this._bound_resolveState);
        tl.rawPosition = pos;
    };


    p._resolveState = function () {
        var tl = this.timeline;
        this.currentFrame = tl.position;

        for (var n in this._managed) {
            this._managed[n] = 1;
        }

        var tweens = tl.tweens;
        for (var i = 0, l = tweens.length; i < l; i++) {
            var tween = tweens[i], target = tween.target;
            if (target === this || tween.passive) {
                continue;
            }
            var offset = tween._stepPosition;

            if (target instanceof createjs.DisplayObject) {

                this._addManagedChild(target, offset);
            } else {

                this._setState(target.state, offset);
            }
        }

        var kids = this.children;
        for (i = kids.length - 1; i >= 0; i--) {
            var id = kids[i].id;
            if (this._managed[id] === 1) {
                this.removeChildAt(i);
                delete(this._managed[id]);
            }
        }
    };


    p._setState = function (state, offset) {
        if (!state) {
            return;
        }
        for (var i = state.length - 1; i >= 0; i--) {
            var o = state[i];
            var target = o.t;
            var props = o.p;
            for (var n in props) {
                target[n] = props[n];
            }
            this._addManagedChild(target, offset);
        }
    };


    p._addManagedChild = function (child, offset) {
        if (child._off) {
            return;
        }
        this.addChildAt(child, 0);

        if (child instanceof MovieClip) {
            child._synchOffset = offset;


            if (child.mode === MovieClip.INDEPENDENT && child.autoReset && (!this._managed[child.id])) {
                child._reset();
            }
        }
        this._managed[child.id] = 2;
    };


    p._getBounds = function (matrix, ignoreTransform) {
        var bounds = this.DisplayObject_getBounds();
        if (!bounds) {
            if (this.frameBounds) {
                bounds = this._rectangle.copy(this.frameBounds[this.currentFrame]);
            }
        }
        if (bounds) {
            return this._transformBounds(bounds, matrix, ignoreTransform);
        }
        return this.Container__getBounds(matrix, ignoreTransform);
    };


    createjs.MovieClip = createjs.promote(MovieClip, 'Container');


    function MovieClipPlugin () {
        throw('MovieClipPlugin cannot be instantiated.');
    }


    MovieClipPlugin.priority = 100;


    MovieClipPlugin.ID = 'MovieClip';


    MovieClipPlugin.install = function () {
        createjs.Tween._installPlugin(MovieClipPlugin);
    };


    MovieClipPlugin.init = function (tween, prop, value) {
        if (prop === 'startPosition' && tween.target instanceof MovieClip) {
            tween._addPlugin(MovieClipPlugin);
        }
    };


    MovieClipPlugin.step = function (tween, step, props) {};


    MovieClipPlugin.change = function (tween, step, prop, value, ratio, end) {
        if (prop === 'startPosition') {
            return (ratio === 1 ? step.props[prop] : step.prev.props[prop]);
        }
    };

}());
