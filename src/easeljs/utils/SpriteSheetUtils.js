this.createjs = this.createjs || {};

(function () {
    'use strict';


    function SpriteSheetUtils () {
        throw 'SpriteSheetUtils cannot be instantiated';
    }


    var canvas = (createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas'));
    if (canvas.getContext) {
        SpriteSheetUtils._workingCanvas = canvas;
        SpriteSheetUtils._workingContext = canvas.getContext('2d');
        canvas.width = canvas.height = 1;
    }


    SpriteSheetUtils.extractFrame = function (spriteSheet, frameOrAnimation) {
        if (isNaN(frameOrAnimation)) {
            frameOrAnimation = spriteSheet.getAnimation(frameOrAnimation).frames[0];
        }
        var data = spriteSheet.getFrame(frameOrAnimation);
        if (!data) {
            return null;
        }
        var r = data.rect;
        var canvas = SpriteSheetUtils._workingCanvas;
        canvas.width = r.width;
        canvas.height = r.height;
        SpriteSheetUtils._workingContext.drawImage(data.image, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
        var img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        return img;
    };


    SpriteSheetUtils.addFlippedFrames = createjs.deprecate(null, 'SpriteSheetUtils.addFlippedFrames');


    SpriteSheetUtils.mergeAlpha = createjs.deprecate(null, 'SpriteSheetUtils.mergeAlpha');


    SpriteSheetUtils._flip = function (spriteSheet, count, h, v) {
        var imgs = spriteSheet._images;
        var canvas = SpriteSheetUtils._workingCanvas;
        var ctx = SpriteSheetUtils._workingContext;
        var il = imgs.length / count;
        for (var i = 0; i < il; i++) {
            var src = imgs[i];
            src.__tmp = i;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width + 1, canvas.height + 1);
            canvas.width = src.width;
            canvas.height = src.height;
            ctx.setTransform(h ? -1 : 1, 0, 0, v ? -1 : 1, h ? src.width : 0, v ? src.height : 0);
            ctx.drawImage(src, 0, 0);
            var img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');

            img.width = (src.width || src.naturalWidth);
            img.height = (src.height || src.naturalHeight);
            imgs.push(img);
        }

        var frames = spriteSheet._frames;
        var fl = frames.length / count;
        for (i = 0; i < fl; i++) {
            src = frames[i];
            var rect = src.rect.clone();
            img = imgs[src.image.__tmp + il * count];

            var frame = { image: img, rect: rect, regX: src.regX, regY: src.regY };
            if (h) {
                rect.x = (img.width || img.naturalWidth) - rect.x - rect.width;
                frame.regX = rect.width - src.regX;
            }
            if (v) {
                rect.y = (img.height || img.naturalHeight) - rect.y - rect.height;
                frame.regY = rect.height - src.regY;
            }
            frames.push(frame);
        }

        var sfx = '_' + (h ? 'h' : '') + (v ? 'v' : '');
        var names = spriteSheet._animations;
        var data = spriteSheet._data;
        var al = names.length / count;
        for (i = 0; i < al; i++) {
            var name = names[i];
            src = data[name];
            var anim = { name: name + sfx, speed: src.speed, next: src.next, frames: [] };
            if (src.next) {
                anim.next += sfx;
            }
            frames = src.frames;
            for (var j = 0, l = frames.length; j < l; j++) {
                anim.frames.push(frames[j] + fl * count);
            }
            data[anim.name] = anim;
            names.push(anim.name);
        }
    };


    createjs.SpriteSheetUtils = SpriteSheetUtils;
}());
