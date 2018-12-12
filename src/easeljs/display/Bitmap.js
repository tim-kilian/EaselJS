this.createjs = this.createjs || {};

(function () {


    function Bitmap (imageOrUri) {
        this.DisplayObject_constructor();


        if (typeof imageOrUri == 'string') {
            this.image = document.createElement('img');
            this.image.src = imageOrUri;
        } else {
            this.image = imageOrUri;
        }


        this.sourceRect = null;


        this._webGLRenderStyle = createjs.DisplayObject._StageGL_BITMAP;
    }

    var p = createjs.extend(Bitmap, createjs.DisplayObject);


    p.initialize = Bitmap;


    p.isVisible = function () {
        var image = this.image;
        var hasContent = this.cacheCanvas || (image && (image.naturalWidth || image.getContext || image.readyState >= 2));
        return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
    };


    p.draw = function (ctx, ignoreCache) {
        if (this.DisplayObject_draw(ctx, ignoreCache)) {
            return true;
        }
        var img = this.image, rect = this.sourceRect;
        if (img.getImage) {
            img = img.getImage();
        }
        if (!img) {
            return true;
        }
        if (rect) {

            var x1 = rect.x, y1 = rect.y, x2 = x1 + rect.width, y2 = y1 + rect.height, x = 0, y = 0, w = img.width,
                h = img.height;
            if (x1 < 0) {
                x -= x1;
                x1 = 0;
            }
            if (x2 > w) {
                x2 = w;
            }
            if (y1 < 0) {
                y -= y1;
                y1 = 0;
            }
            if (y2 > h) {
                y2 = h;
            }
            ctx.drawImage(img, x1, y1, x2 - x1, y2 - y1, x, y, x2 - x1, y2 - y1);
        } else {
            ctx.drawImage(img, 0, 0);
        }
        return true;
    };


    p.getBounds = function () {
        var rect = this.DisplayObject_getBounds();
        if (rect) {
            return rect;
        }
        var image = this.image, o = this.sourceRect || image;
        var hasContent = (image && (image.naturalWidth || image.getContext || image.readyState >= 2));
        return hasContent ? this._rectangle.setValues(0, 0, o.width, o.height) : null;
    };


    p.clone = function (node) {
        var image = this.image;
        if (image && node) {
            image = image.cloneNode();
            image.src = image.src;
        }
        var o = new Bitmap(image);
        if (this.sourceRect) {
            o.sourceRect = this.sourceRect.clone();
        }
        this._cloneProps(o);
        return o;
    };


    p.toString = function () {
        return '[Bitmap (name=' + this.name + ')]';
    };


    createjs.Bitmap = createjs.promote(Bitmap, 'DisplayObject');
}());
