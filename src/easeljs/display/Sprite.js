this.createjs = this.createjs || {};

(function () {
    'use strict';


    function Sprite (spriteSheet, frameOrAnimation) {
        this.DisplayObject_constructor();


        this.currentFrame = 0;


        this.currentAnimation = null;


        this.paused = true;


        this.spriteSheet = spriteSheet;


        this.currentAnimationFrame = 0;


        this.framerate = 0;


        this._animation = null;


        this._currentFrame = null;


        this._skipAdvance = false;


        this._webGLRenderStyle = createjs.DisplayObject._StageGL_SPRITE;

        if (frameOrAnimation != null) {
            this.gotoAndPlay(frameOrAnimation);
        }
    }

    var p = createjs.extend(Sprite, createjs.DisplayObject);


    p.initialize = Sprite;


    p.isVisible = function () {
        var hasContent = this.cacheCanvas || this.spriteSheet.complete;
        return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
    };


    p.draw = function (ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return true;
        }
        this._normalizeFrame();
        var o = this.spriteSheet.getFrame(this._currentFrame | 0);
        if (!o) {
            return false;
        }
        var rect = o.rect;
        if (rect.width && rect.height) {
            ctx.drawImage(o.image, rect.x, rect.y, rect.width, rect.height, -o.regX, -o.regY, rect.width, rect.height);
        }
        return true;
    };


    p.play = function () {
        this.paused = false;
    };


    p.stop = function () {
        this.paused = true;
    };


    p.gotoAndPlay = function (frameOrAnimation) {
        this.paused = false;
        this._skipAdvance = true;
        this._goto(frameOrAnimation);
    };


    p.gotoAndStop = function (frameOrAnimation) {
        this.paused = true;
        this._goto(frameOrAnimation);
    };


    p.advance = function (time) {
        var fps = this.framerate || this.spriteSheet.framerate;
        var t = (fps && time != null) ? time / (1000 / fps) : 1;
        this._normalizeFrame(t);
    };


    p.getBounds = function () {

        return this.DisplayObject_getBounds() || this.spriteSheet.getFrameBounds(this.currentFrame, this._rectangle);
    };


    p.clone = function () {
        return this._cloneProps(new Sprite(this.spriteSheet));
    };


    p.toString = function () {
        return '[Sprite (name=' + this.name + ')]';
    };


    p._cloneProps = function (o) {
        this.DisplayObject__cloneProps(o);
        o.currentFrame = this.currentFrame;
        o.currentAnimation = this.currentAnimation;
        o.paused = this.paused;
        o.currentAnimationFrame = this.currentAnimationFrame;
        o.framerate = this.framerate;

        o._animation = this._animation;
        o._currentFrame = this._currentFrame;
        o._skipAdvance = this._skipAdvance;
        return o;
    };


    p._tick = function (evtObj) {
        if (!this.paused) {
            if (!this._skipAdvance) {
                this.advance(evtObj && evtObj.delta);
            }
            this._skipAdvance = false;
        }
        this.DisplayObject__tick(evtObj);
    };


    p._normalizeFrame = function (frameDelta) {
        frameDelta = frameDelta || 0;
        var animation = this._animation;
        var paused = this.paused;
        var frame = this._currentFrame;
        var l;

        if (animation) {
            var speed = animation.speed || 1;
            var animFrame = this.currentAnimationFrame;
            l = animation.frames.length;
            if (animFrame + frameDelta * speed >= l) {
                var next = animation.next;
                if (this._dispatchAnimationEnd(animation, frame, paused, next, l - 1)) {

                    return;
                } else if (next) {

                    return this._goto(next, frameDelta - (l - animFrame) / speed);
                } else {

                    this.paused = true;
                    animFrame = animation.frames.length - 1;
                }
            } else {
                animFrame += frameDelta * speed;
            }
            this.currentAnimationFrame = animFrame;
            this._currentFrame = animation.frames[animFrame | 0];
        } else {
            frame = (this._currentFrame += frameDelta);
            l = this.spriteSheet.getNumFrames();
            if (frame >= l && l > 0) {
                if (!this._dispatchAnimationEnd(animation, frame, paused, l - 1)) {

                    if ((this._currentFrame -= l) >= l) {
                        return this._normalizeFrame();
                    }
                }
            }
        }
        frame = this._currentFrame | 0;
        if (this.currentFrame != frame) {
            this.currentFrame = frame;
            this.dispatchEvent('change');
        }
    };


    p._dispatchAnimationEnd = function (animation, frame, paused, next, end) {
        var name = animation ? animation.name : null;
        if (this.hasEventListener('animationend')) {
            var evt = new createjs.Event('animationend');
            evt.name = name;
            evt.next = next;
            this.dispatchEvent(evt);
        }

        var changed = (this._animation != animation || this._currentFrame != frame);

        if (!changed && !paused && this.paused) {
            this.currentAnimationFrame = end;
            changed = true;
        }
        return changed;
    };


    p._goto = function (frameOrAnimation, frame) {
        this.currentAnimationFrame = 0;
        if (isNaN(frameOrAnimation)) {
            var data = this.spriteSheet.getAnimation(frameOrAnimation);
            if (data) {
                this._animation = data;
                this.currentAnimation = frameOrAnimation;
                this._normalizeFrame(frame);
            }
        } else {
            this.currentAnimation = this._animation = null;
            this._currentFrame = frameOrAnimation;
            this._normalizeFrame();
        }
    };


    createjs.Sprite = createjs.promote(Sprite, 'DisplayObject');
}());
