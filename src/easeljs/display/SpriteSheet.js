this.createjs = this.createjs || {};

(function () {
    'use strict';


    function SpriteSheet (data) {
        this.EventDispatcher_constructor();


        this.complete = true;


        this.framerate = 0;


        this._animations = null;


        this._frames = null;


        this._images = null;


        this._data = null;


        this._loadCount = 0;


        this._frameHeight = 0;


        this._frameWidth = 0;


        this._numFrames = 0;


        this._regX = 0;


        this._regY = 0;


        this._spacing = 0;


        this._margin = 0;


        this._parseData(data);
    }

    var p = createjs.extend(SpriteSheet, createjs.EventDispatcher);


    p._getAnimations = function () {
        return this._animations.slice();
    };


    p.getAnimations = createjs.deprecate(p._getAnimations, 'SpriteSheet.getAnimations');


    try {
        Object.defineProperties(p, {
            animations: { get: p._getAnimations },
        });
    } catch (e) {
    }


    p.getNumFrames = function (animation) {
        if (animation == null) {
            return this._frames ? this._frames.length : this._numFrames || 0;
        } else {
            var data = this._data[animation];
            if (data == null) {
                return 0;
            }
            else {
                return data.frames.length;
            }
        }
    };


    p.getAnimation = function (name) {
        return this._data[name];
    };


    p.getFrame = function (frameIndex) {
        var frame;
        if (this._frames && (frame = this._frames[frameIndex])) {
            return frame;
        }
        return null;
    };


    p.getFrameBounds = function (frameIndex, rectangle) {
        var frame = this.getFrame(frameIndex);
        return frame ? (rectangle || new createjs.Rectangle()).setValues(-frame.regX, -frame.regY, frame.rect.width, frame.rect.height) : null;
    };


    p.toString = function () {
        return '[SpriteSheet]';
    };


    p.clone = function () {
        throw('SpriteSheet cannot be cloned.');
    };


    p._parseData = function (data) {
        var i, l, o, a;
        if (data == null) {
            return;
        }

        this.framerate = data.framerate || 0;


        if (data.images && (l = data.images.length) > 0) {
            a = this._images = [];
            for (i = 0; i < l; i++) {
                var img = data.images[i];
                if (typeof img == 'string') {
                    var src = img;
                    img = document.createElement('img');
                    img.src = src;
                }
                a.push(img);
                if (!img.getContext && !img.naturalWidth) {
                    this._loadCount++;
                    this.complete = false;
                    (function (o, src) { img.onload = function () { o._handleImageLoad(src); }; })(this, src);
                    (function (o, src) { img.onerror = function () { o._handleImageError(src); }; })(this, src);
                }
            }
        }


        if (data.frames == null) {
        } else if (Array.isArray(data.frames)) {
            this._frames = [];
            a = data.frames;
            for (i = 0, l = a.length; i < l; i++) {
                var arr = a[i];
                this._frames.push({
                    image: this._images[arr[4] ? arr[4] : 0],
                    rect: new createjs.Rectangle(arr[0], arr[1], arr[2], arr[3]),
                    regX: arr[5] || 0,
                    regY: arr[6] || 0,
                });
            }
        } else {
            o = data.frames;
            this._frameWidth = o.width;
            this._frameHeight = o.height;
            this._regX = o.regX || 0;
            this._regY = o.regY || 0;
            this._spacing = o.spacing || 0;
            this._margin = o.margin || 0;
            this._numFrames = o.count;
            if (this._loadCount == 0) {
                this._calculateFrames();
            }
        }


        this._animations = [];
        if ((o = data.animations) != null) {
            this._data = {};
            var name;
            for (name in o) {
                var anim = { name: name };
                var obj = o[name];
                if (typeof obj == 'number') {
                    a = anim.frames = [obj];
                } else if (Array.isArray(obj)) {
                    if (obj.length == 1) {
                        anim.frames = [obj[0]];
                    }
                    else {
                        anim.speed = obj[3];
                        anim.next = obj[2];
                        a = anim.frames = [];
                        for (i = obj[0]; i <= obj[1]; i++) {
                            a.push(i);
                        }
                    }
                } else {
                    anim.speed = obj.speed;
                    anim.next = obj.next;
                    var frames = obj.frames;
                    a = anim.frames = (typeof frames == 'number') ? [frames] : frames.slice(0);
                }
                if (anim.next === true || anim.next === undefined) {
                    anim.next = name;
                }
                if (anim.next === false || (a.length < 2 && anim.next == name)) {
                    anim.next = null;
                }
                if (!anim.speed) {
                    anim.speed = 1;
                }
                this._animations.push(name);
                this._data[name] = anim;
            }
        }
    };


    p._handleImageLoad = function (src) {
        if (--this._loadCount == 0) {
            this._calculateFrames();
            this.complete = true;
            this.dispatchEvent('complete');
        }
    };


    p._handleImageError = function (src) {
        var errorEvent = new createjs.Event('error');
        errorEvent.src = src;
        this.dispatchEvent(errorEvent);


        if (--this._loadCount == 0) {
            this.dispatchEvent('complete');
        }
    };


    p._calculateFrames = function () {
        if (this._frames || this._frameWidth == 0) {
            return;
        }

        this._frames = [];

        var maxFrames = this._numFrames || 100000;
        var frameCount = 0, frameWidth = this._frameWidth, frameHeight = this._frameHeight;
        var spacing = this._spacing, margin = this._margin;

        imgLoop:
            for (var i = 0, imgs = this._images; i < imgs.length; i++) {
                var img = imgs[i], imgW = (img.width || img.naturalWidth), imgH = (img.height || img.naturalHeight);

                var y = margin;
                while (y <= imgH - margin - frameHeight) {
                    var x = margin;
                    while (x <= imgW - margin - frameWidth) {
                        if (frameCount >= maxFrames) {
                            break imgLoop;
                        }
                        frameCount++;
                        this._frames.push({
                            image: img,
                            rect: new createjs.Rectangle(x, y, frameWidth, frameHeight),
                            regX: this._regX,
                            regY: this._regY,
                        });
                        x += frameWidth + spacing;
                    }
                    y += frameHeight + spacing;
                }
            }
        this._numFrames = frameCount;
    };


    createjs.SpriteSheet = createjs.promote(SpriteSheet, 'EventDispatcher');
}());
