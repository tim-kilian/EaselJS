this.createjs = this.createjs || {};

(function () {
    'use strict';


    function SpriteSheetBuilder (framerate) {
        this.EventDispatcher_constructor();


        this.maxWidth = 2048;


        this.maxHeight = 2048;


        this.spriteSheet = null;


        this.scale = 1;


        this.padding = 1;


        this.timeSlice = 0.3;


        this.progress = -1;


        this.framerate = framerate || 0;


        this._frames = [];


        this._animations = {};


        this._data = null;


        this._nextFrameIndex = 0;


        this._index = 0;


        this._timerID = null;


        this._scale = 1;
    }

    var p = createjs.extend(SpriteSheetBuilder, createjs.EventDispatcher);


    SpriteSheetBuilder.ERR_DIMENSIONS = 'frame dimensions exceed max spritesheet dimensions';
    SpriteSheetBuilder.ERR_RUNNING = 'a build is already running';


    p.addFrame = function (source, sourceRect, scale, setupFunction, setupData) {
        if (this._data) {
            throw SpriteSheetBuilder.ERR_RUNNING;
        }
        var rect = sourceRect || source.bounds || source.nominalBounds;
        if (!rect && source.getBounds) {
            rect = source.getBounds();
        }
        if (!rect) {
            return null;
        }
        scale = scale || 1;
        return this._frames.push({
            source: source,
            sourceRect: rect,
            scale: scale,
            funct: setupFunction,
            data: setupData,
            index: this._frames.length,
            height: rect.height * scale,
        }) - 1;
    };


    p.addAnimation = function (name, frames, next, speed) {
        if (this._data) {
            throw SpriteSheetBuilder.ERR_RUNNING;
        }
        this._animations[name] = { frames: frames, next: next, speed: speed };
    };


    p.addMovieClip = function (source, sourceRect, scale, setupFunction, setupData, labelFunction) {
        if (this._data) {
            throw SpriteSheetBuilder.ERR_RUNNING;
        }
        var rects = source.frameBounds;
        var rect = sourceRect || source.bounds || source.nominalBounds;
        if (!rect && source.getBounds) {
            rect = source.getBounds();
        }
        if (!rect && !rects) {
            return;
        }

        var i, l, baseFrameIndex = this._frames.length;
        var duration = source.timeline.duration;
        for (i = 0; i < duration; i++) {
            var r = (rects && rects[i]) ? rects[i] : rect;
            this.addFrame(source, r, scale, this._setupMovieClipFrame, { i: i, f: setupFunction, d: setupData });
        }
        var labels = source.timeline._labels;
        var lbls = [];
        for (var n in labels) {
            lbls.push({ index: labels[n], label: n });
        }
        if (lbls.length) {
            lbls.sort(function (a, b) { return a.index - b.index; });
            for (i = 0, l = lbls.length; i < l; i++) {
                var label = lbls[i].label;
                var start = baseFrameIndex + lbls[i].index;
                var end = baseFrameIndex + ((i == l - 1) ? duration : lbls[i + 1].index);
                var frames = [];
                for (var j = start; j < end; j++) {
                    frames.push(j);
                }
                if (labelFunction) {
                    label = labelFunction(label, source, start, end);
                    if (!label) {
                        continue;
                    }
                }
                this.addAnimation(label, frames, true);
            }
        }
    };


    p.build = function () {
        if (this._data) {
            throw SpriteSheetBuilder.ERR_RUNNING;
        }
        this._startBuild();
        while (this._drawNext()) {
        }
        this._endBuild();
        return this.spriteSheet;
    };


    p.buildAsync = function (timeSlice) {
        if (this._data) {
            throw SpriteSheetBuilder.ERR_RUNNING;
        }
        this.timeSlice = timeSlice;
        this._startBuild();
        var _this = this;
        this._timerID = setTimeout(function () { _this._run(); }, 50 - Math.max(0.01, Math.min(0.99, this.timeSlice || 0.3)) * 50);
    };


    p.stopAsync = function () {
        clearTimeout(this._timerID);
        this._data = null;
    };


    p.clone = function () {
        throw('SpriteSheetBuilder cannot be cloned.');
    };


    p.toString = function () {
        return '[SpriteSheetBuilder]';
    };


    p._startBuild = function () {
        var pad = this.padding || 0;
        this.progress = 0;
        this.spriteSheet = null;
        this._index = 0;
        this._scale = this.scale;
        var dataFrames = [];
        this._data = {
            images: [],
            frames: dataFrames,
            framerate: this.framerate,
            animations: this._animations,
        };

        var frames = this._frames.slice();
        frames.sort(function (a, b) { return (a.height <= b.height) ? -1 : 1; });

        if (frames[frames.length - 1].height + pad * 2 > this.maxHeight) {
            throw SpriteSheetBuilder.ERR_DIMENSIONS;
        }
        var y = 0, x = 0;
        var img = 0;
        while (frames.length) {
            var o = this._fillRow(frames, y, img, dataFrames, pad);
            if (o.w > x) {
                x = o.w;
            }
            y += o.h;
            if (!o.h || !frames.length) {
                var canvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas');
                canvas.width = this._getSize(x, this.maxWidth);
                canvas.height = this._getSize(y, this.maxHeight);
                this._data.images[img] = canvas;
                if (!o.h) {
                    x = y = 0;
                    img++;
                }
            }
        }
    };


    p._setupMovieClipFrame = function (source, data) {
        var ae = source.actionsEnabled;
        source.actionsEnabled = false;
        source.gotoAndStop(data.i);
        source.actionsEnabled = ae;
        data.f && data.f(source, data.d, data.i);
    };


    p._getSize = function (size, max) {
        var pow = 4;
        while (Math.pow(2, ++pow) < size) {
        }
        return Math.min(max, Math.pow(2, pow));
    };


    p._fillRow = function (frames, y, img, dataFrames, pad) {
        var w = this.maxWidth;
        var maxH = this.maxHeight;
        y += pad;
        var h = maxH - y;
        var x = pad;
        var height = 0;
        for (var i = frames.length - 1; i >= 0; i--) {
            var frame = frames[i];
            var sc = this._scale * frame.scale;
            var rect = frame.sourceRect;
            var source = frame.source;
            var rx = Math.floor(sc * rect.x - pad);
            var ry = Math.floor(sc * rect.y - pad);
            var rh = Math.ceil(sc * rect.height + pad * 2);
            var rw = Math.ceil(sc * rect.width + pad * 2);
            if (rw > w) {
                throw SpriteSheetBuilder.ERR_DIMENSIONS;
            }
            if (rh > h || x + rw > w) {
                continue;
            }
            frame.img = img;
            frame.rect = new createjs.Rectangle(x, y, rw, rh);
            height = height || rh;
            frames.splice(i, 1);
            dataFrames[frame.index] = [x, y, rw, rh, img, Math.round(-rx + sc * source.regX - pad), Math.round(-ry + sc * source.regY - pad)];
            x += rw;
        }
        return { w: x, h: height };
    };


    p._endBuild = function () {
        this.spriteSheet = new createjs.SpriteSheet(this._data);
        this._data = null;
        this.progress = 1;
        this.dispatchEvent('complete');
    };


    p._run = function () {
        var ts = Math.max(0.01, Math.min(0.99, this.timeSlice || 0.3)) * 50;
        var t = (new Date()).getTime() + ts;
        var complete = false;
        while (t > (new Date()).getTime()) {
            if (!this._drawNext()) {
                complete = true;
                break;
            }
        }
        if (complete) {
            this._endBuild();
        } else {
            var _this = this;
            this._timerID = setTimeout(function () { _this._run(); }, 50 - ts);
        }
        var p = this.progress = this._index / this._frames.length;
        if (this.hasEventListener('progress')) {
            var evt = new createjs.Event('progress');
            evt.progress = p;
            this.dispatchEvent(evt);
        }
    };


    p._drawNext = function () {
        var frame = this._frames[this._index];
        var sc = frame.scale * this._scale;
        var rect = frame.rect;
        var sourceRect = frame.sourceRect;
        var canvas = this._data.images[frame.img];
        var ctx = canvas.getContext('2d');
        frame.funct && frame.funct(frame.source, frame.data);
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.clip();
        ctx.translate(Math.ceil(rect.x - sourceRect.x * sc), Math.ceil(rect.y - sourceRect.y * sc));
        ctx.scale(sc, sc);
        frame.source.draw(ctx);
        ctx.restore();
        return (++this._index) < this._frames.length;
    };


    createjs.SpriteSheetBuilder = createjs.promote(SpriteSheetBuilder, 'EventDispatcher');
}());
