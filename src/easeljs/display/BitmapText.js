this.createjs = this.createjs || {};

(function () {
    'use strict';


    function BitmapText (text, spriteSheet) {
        this.Container_constructor();


        this.text = text || '';


        this.spriteSheet = spriteSheet;


        this.lineHeight = 0;


        this.letterSpacing = 0;


        this.spaceWidth = 0;


        this._oldProps = { text: 0, spriteSheet: 0, lineHeight: 0, letterSpacing: 0, spaceWidth: 0 };


        this._oldStage = null;

        this._drawAction = null;
    }

    var p = createjs.extend(BitmapText, createjs.Container);


    BitmapText.maxPoolSize = 100;


    BitmapText._spritePool = [];


    p.draw = function (ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return;
        }
        this._updateState();
        this.Container_draw(ctx, ignoreCache);
    };


    p.getBounds = function () {
        this._updateText();
        return this.Container_getBounds();
    };


    p.isVisible = function () {
        var hasContent = this.cacheCanvas || (this.spriteSheet && this.spriteSheet.complete && this.text);
        return !!(this.visible && this.alpha > 0 && this.scaleX !== 0 && this.scaleY !== 0 && hasContent);
    };

    p.clone = function () {
        return this._cloneProps(new BitmapText(this.text, this.spriteSheet));
    };


    p.addChild = p.addChildAt = p.removeChild = p.removeChildAt = p.removeAllChildren = function () {};


    p._updateState = function () {
        this._updateText();
    };


    p._cloneProps = function (o) {
        this.Container__cloneProps(o);
        o.lineHeight = this.lineHeight;
        o.letterSpacing = this.letterSpacing;
        o.spaceWidth = this.spaceWidth;
        return o;
    };


    p._getFrameIndex = function (character, spriteSheet) {
        var c, o = spriteSheet.getAnimation(character);
        if (!o) {
            (character != (c = character.toUpperCase())) || (character != (c = character.toLowerCase())) || (c = null);
            if (c) {
                o = spriteSheet.getAnimation(c);
            }
        }
        return o && o.frames[0];
    };


    p._getFrame = function (character, spriteSheet) {
        var index = this._getFrameIndex(character, spriteSheet);
        return index == null ? index : spriteSheet.getFrame(index);
    };


    p._getLineHeight = function (ss) {
        var frame = this._getFrame('1', ss) || this._getFrame('T', ss) || this._getFrame('L', ss) || ss.getFrame(0);
        return frame ? frame.rect.height : 1;
    };


    p._getSpaceWidth = function (ss) {
        var frame = this._getFrame('1', ss) || this._getFrame('l', ss) || this._getFrame('e', ss) || this._getFrame('a', ss) || ss.getFrame(0);
        return frame ? frame.rect.width : 1;
    };


    p._updateText = function () {
        var x = 0, y = 0, o = this._oldProps, change = false, spaceW = this.spaceWidth, lineH = this.lineHeight,
            ss = this.spriteSheet;
        var pool = BitmapText._spritePool, kids = this.children, childIndex = 0, numKids = kids.length, sprite;

        for (var n in o) {
            if (o[n] != this[n]) {
                o[n] = this[n];
                change = true;
            }
        }
        if (!change) {
            return;
        }

        var hasSpace = !!this._getFrame(' ', ss);
        if (!hasSpace && !spaceW) {
            spaceW = this._getSpaceWidth(ss);
        }
        if (!lineH) {
            lineH = this._getLineHeight(ss);
        }

        for (var i = 0, l = this.text.length; i < l; i++) {
            var character = this.text.charAt(i);
            if (character == ' ' && !hasSpace) {
                x += spaceW;
                continue;
            } else if (character == '\n' || character == '\r') {
                if (character == '\r' && this.text.charAt(i + 1) == '\n') {
                    i++;
                }
                x = 0;
                y += lineH;
                continue;
            }

            var index = this._getFrameIndex(character, ss);
            if (index == null) {
                continue;
            }

            if (childIndex < numKids) {
                sprite = kids[childIndex];
            } else {
                kids.push(sprite = pool.length ? pool.pop() : new createjs.Sprite());
                sprite.parent = this;
                numKids++;
            }
            sprite.spriteSheet = ss;
            sprite.gotoAndStop(index);
            sprite.x = x;
            sprite.y = y;
            childIndex++;

            x += sprite.getBounds().width + this.letterSpacing;
        }
        while (numKids > childIndex) {

            pool.push(sprite = kids.pop());
            sprite.parent = null;
            numKids--;
        }
        if (pool.length > BitmapText.maxPoolSize) {
            pool.length = BitmapText.maxPoolSize;
        }
    };


    createjs.BitmapText = createjs.promote(BitmapText, 'Container');
}());
