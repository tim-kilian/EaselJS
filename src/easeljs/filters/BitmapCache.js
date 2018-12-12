this.createjs = this.createjs || {};

(function () {
    'use strict';


    function BitmapCache () {


        this.width = undefined;


        this.height = undefined;


        this.x = undefined;


        this.y = undefined;


        this.scale = 1;


        this.offX = 0;


        this.offY = 0;


        this.cacheID = 0;


        this._filterCount = 0;


        this._filterOffX = 0;


        this._filterOffY = 0;


        this._disabled = false;


        this._autoGenerated = false;


        this._cacheCanvas = null;


        this._stageGL = null;


        this._cacheDataURLID = 0;


        this._cacheDataURL = null;


        this._drawWidth = 0;


        this._drawHeight = 0;


        this._boundRect = new createjs.Rectangle();


        this._counterMatrix = null;


        this._bufferTextureOutput = null;


        this._bufferTextureConcat = null;


        this._bufferTextureTemp = null;
    }

    var p = BitmapCache.prototype;

    p._get_disabled = function () {
        return this._disabled;
    };
    p._set_disabled = function (value) {
        this._disabled = !!value;
        if (this.target) {
            this.target.cacheCanvas = (this._disabled || this._autoGenerated) ? null : this._cacheCanvas;
        }
    };

    try {
        Object.defineProperties(p, {

            disabled: { get: p._get_disabled, set: p._set_disabled },
        });
    } catch (e) {
    }


    BitmapCache.getFilterBounds = function (target, output) {
        if (!output) {
            output = new createjs.Rectangle();
        }
        var filters = target.filters;
        var filterCount = filters && filters.length;
        if (!!filterCount <= 0) {
            return output;
        }

        for (var i = 0; i < filterCount; i++) {
            var f = filters[i];
            if (!f || !f.getBounds) {
                continue;
            }
            var test = f.getBounds();
            if (!test) {
                continue;
            }
            if (i === 0) {
                output.setValues(test.x, test.y, test.width, test.height);
            } else {
                output.extend(test.x, test.y, test.width, test.height);
            }
        }

        return output;
    };


    BitmapCache.filterCounter = function (acc, o) {
        var out = 1;
        while (o._multiPass) {
            o = o._multiPass;
            out++;
        }
        return acc + out;
    };


    p.toString = function () {
        return '[BitmapCache]';
    };

    /**
     * Actually create the correct cache surface and properties associated with it. Caching and it's benefits are discussed
     * by the {{#crossLink "DisplayObject/cache"}}{{/crossLink}} function and this class description. Here are the detailed
     * specifics of how to use the options object.
     *
     * - If options.useGL is set to "new" a StageGL is created and contained on this for use when rendering the cache.
     * - If options.useGL is set to "stage" if the current stage is a StageGL it will be used. Must be added to a stage first to work.
     * - If options.useGL is a StageGL instance then it will use it to cache. Warning, caches made on one StageGL will not render on any other StageGL.
     * - If options.useGL is undefined a Context 2D cache will be performed.
     *
     * This means you can use any combination of StageGL and 2D with either, neither, or both the stage and cache being
     * WebGL. Using "new" with a StageGL display list is highly unrecommended, but still an option. It should be avoided
     * due to negative performance reasons and the Image loading limitation noted in the class complications above.
     *
     * When "options.useGL" is set to the parent stage of the target and WebGL, performance is increased by using
     * "RenderTextures" instead of canvas elements. These are internal Textures on the graphics card stored in the GPU.
     * Because they are no longer canvases you cannot perform operations you could with a regular canvas. The benefit
     * is that this avoids the slowdown of copying the texture back and forth from the GPU to a Canvas element.
     * This means "stage" is the recommended option when available.
     *
     * A StageGL cache does not infer the ability to draw objects a StageGL cannot currently draw, i.e. do not use a
     * WebGL context cache when caching a Shape, Text, etc.
     * <h4>WebGL cache with a 2D context</h4>
     *
     *     var stage = new createjs.Stage();
     *     var bmp = new createjs.Bitmap(src);
     *     bmp.cache(0, 0, bmp.width, bmp.height, 1, {gl: "new"});          // no StageGL to use, so make one
     *
     *     var shape = new createjs.Shape();
     *     shape.graphics.clear().fill("red").drawRect(0,0,20,20);
     *     shape.cache(0, 0, 20, 20, 1);                             // cannot use WebGL cache
     *
     * <h4>WebGL cache with a WebGL context</h4>
     *
     *     var stageGL = new createjs.StageGL();
     *     var bmp = new createjs.Bitmap(src);
     *
     *     // option 1
     *     stageGL.addChild(bmp);
     *     bmp.cache(0, 0, bmp.width, bmp.height, 1, {gl: "stage"});       // when added to the display list we can look it up
     *     // option 2
     *     bmp.cache(0, 0, bmp.width, bmp.height, 1, {gl: stageGL});       // we can specify it explicitly if we add it later
     *     stageGL.addChild(bmp);
     *
     *     var shape = new createjs.Shape();
     *     shape.graphics.clear().fill("red").drawRect(0,0,20,20);
     *     shape.cache(0, 0, 20, 20, 1);                             // cannot use WebGL cache
     *
     * You may wish to create your own StageGL instance to control factors like clear color, transparency, AA, and
     * others. If the specified stage is not rendering content and just the cache set{{#crossLink "StageGL/isCacheControlled"}}{{/crossLink}}
     * to true on your instance. This will trigger it to behave correctly for rendering your output.
     *
     * @public
     * @method define
     * @param {Number} x The x coordinate origin for the cache region.
     * @param {Number} y The y coordinate origin for the cache region.
     * @param {Number} width The width of the cache region.
     * @param {Number} height The height of the cache region.
     * @param {Number} [scale=1] The scale at which the cache will be created. For example, if you cache a vector shape
     * using myShape.cache(0,0,100,100,2) then the resulting cacheCanvas will be 200x200 px. This lets you scale and
     * rotate cached elements with greater fidelity. Default is 1.
     * @param {Object} [options=undefined] Specify additional parameters for the cache logic
     * @param {undefined|"new"|"stage"|StageGL} [options.useGL=undefined] Select whether to use context 2D, or WebGL rendering, and
     * whether to make a new stage instance or use an existing one. See above for extensive details on use.
     * @for BitmapCache
     */
    p.define = function (target, x, y, width, height, scale, options) {
        if (!target) {
            throw 'No symbol to cache';
        }
        this._options = options;
        this.target = target;

        this.width = width >= 1 ? width : 1;
        this.height = height >= 1 ? height : 1;
        this.x = x || 0;
        this.y = y || 0;
        this.scale = scale || 1;

        this.update();
    };

    /**
     * Directly called via {{#crossLink "DisplayObject/updateCache:method"}}{{/crossLink}}, but also internally. This
     * has the dual responsibility of making sure the surface is ready to be drawn to, and performing the draw. For
     * full details of each behaviour, check the protected functions {{#crossLink "BitmapCache/_updateSurface"}}{{/crossLink}}
     * and {{#crossLink "BitmapCache/_drawToCache"}}{{/crossLink}} respectively.
     * @method update
     * @param {String} [compositeOperation=null] The DisplayObject this cache is linked to.
     **/
    p.update = function (compositeOperation) {
        if (!this.target) {
            throw 'define() must be called before update()';
        }

        var filterBounds = BitmapCache.getFilterBounds(this.target);
        var surface = this._cacheCanvas;

        this._drawWidth = Math.ceil(this.width * this.scale) + filterBounds.width;
        this._drawHeight = Math.ceil(this.height * this.scale) + filterBounds.height;
        this._filterCount = this.target.filters && this.target.filters.reduce(BitmapCache.filterCounter, 0);

        if (!surface || this._drawWidth !== surface.width || this._drawHeight !== surface.height) {
            this._updateSurface();
        }

        if (this._stageGL) {
            if (this._bufferTextureOutput === null) {
                this._bufferTextureOutput = this._stageGL.getRenderBufferTexture(this._drawWidth, this._drawHeight);
            } else {
                this._stageGL.resizeTexture(this._bufferTextureOutput, this._drawWidth, this._drawHeight);
            }

            if (this._cacheCanvas === null) {
                this._cacheCanvas = this._bufferTextureOutput;
                this.disabled = this._disabled;
            }
            if (this._filterCount >= 1) {
                if (this._bufferTextureConcat === null) {
                    this._bufferTextureConcat = this._stageGL.getRenderBufferTexture(this._drawWidth, this._drawHeight);
                } else {
                    this._stageGL.resizeTexture(this._bufferTextureConcat, this._drawWidth, this._drawHeight);
                }
            }
        }

        this._filterOffX = filterBounds.x;
        this._filterOffY = filterBounds.y;
        this.offX = this.x * this.scale + this._filterOffX;
        this.offY = this.y * this.scale + this._filterOffY;

        this._drawToCache(compositeOperation);

        this.cacheID = this.cacheID ? this.cacheID + 1 : 1;
    };

    /**
     * Reset and release all the properties and memory associated with this cache.
     * @method release
     **/
    p.release = function () {
        if (this._stageGL) {
            if (this._bufferTextureOutput !== null) {
                this._stageGL._killTextureObject(this._bufferTextureOutput);
            }
            if (this._bufferTextureConcat !== null) {
                this._stageGL._killTextureObject(this._bufferTextureConcat);
            }
            if (this._bufferTextureTemp !== null) {
                this._stageGL._killTextureObject(this._bufferTextureTemp);
            }
            // set the context to none and let the garbage collector get the rest when the canvas itself gets removed
            this._stageGL = false;
        } else {
            var stage = this.target.stage;
            if (stage instanceof createjs.StageGL) {
                stage.releaseTexture(this._cacheCanvas);
            }
        }

        this.disabled = true;
        this.target = this._cacheCanvas = null;
        this.cacheID = this._cacheDataURLID = this._cacheDataURL = undefined;
        this.width = this.height = this.x = this.y = this.offX = this.offY = 0;
        this.scale = 1;
    };

    /**
     * Returns a data URL for the cache, or `null` if this display object is not cached.
     * Uses {{#crossLink "BitmapCache/cacheID:property"}}{{/crossLink}} to ensure a new data URL is not generated if the
     * cache has not changed.
     * @method getCacheDataURL
     * @return {String} The image data url for the cache.
     **/
    p.getCacheDataURL = function () {
        var cacheCanvas = this.target && this._cacheCanvas;
        if (!cacheCanvas) {
            return null;
        }
        if (this.cacheID !== this._cacheDataURLID) {
            this._cacheDataURLID = this.cacheID;
            this._cacheDataURL = cacheCanvas.toDataURL ? cacheCanvas.toDataURL() : null;
        }
        return this._cacheDataURL;
    };

    /**
     * Use context2D drawing commands to display the cache canvas being used.
     * @method draw
     * @param {CanvasRenderingContext2D} ctx The context to draw into.
     * @return {Boolean} Whether the draw was handled successfully.
     **/
    p.draw = function (ctx) {
        if (!this.target) {
            return false;
        }
        ctx.drawImage(this._cacheCanvas,
            this.x + (this._filterOffX / this.scale), this.y + (this._filterOffY / this.scale),
            this._drawWidth / this.scale, this._drawHeight / this.scale
        );
        return true;
    };

    /**
     * Determine the bounds of the shape in local space.
     * @method getBounds
     * @return {Rectangle}
     */
    p.getBounds = function () {
        var scale = this.scale;
        return this._boundRect.setValues(
            this.x, this.y,
            this.width / scale, this.height / scale
        );
    };

    /**
     * Fetch the correct filter in order, complicated by multipass filtering.
     * @param {Number} lookup The filter in the list to return
     */
    p._getGLFilter = function (lookup) {
        if (this.target.filters === null || lookup < 0) {
            return undefined;
        }
        var i = 0;
        var result = this.target.filters[i];
        while (result && --lookup >= 0) {
            result = result._multiPass ? result._multiPass : this.target.filters[++i];
        }
        return result;
    };

// private methods:
    /**
     * Create or resize the invisible canvas/surface that is needed for the display object(s) to draw to,
     * and in turn be used in their stead when drawing. The surface is resized to the size defined
     * by the width and height, factoring in scaling and filters. Adjust them to adjust the output size.
     * @method _updateSurface
     * @protected
     **/
    p._updateSurface = function () {
        var surface;

        if (!this._options || !this._options.useGL) {
            surface = this._cacheCanvas;

            // create it if it's missing
            if (!surface) {
                surface = this._cacheCanvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas');
                this.disabled = this._disabled;
            }

            // now size it
            surface.width = this._drawWidth;
            surface.height = this._drawHeight;
            return;
        }

        // create it if it's missing
        if (!this._stageGL) {
            if (this._options.useGL === 'stage') {
                var targetStage = this.target.stage;
                // use the stage that this object belongs on as the WebGL context
                if (!(targetStage && targetStage.isWebGL)) {
                    var error = 'Cannot use \'stage\' for cache because the object\'s parent stage is ';
                    error += targetStage ? 'non WebGL.' : 'not set, please addChild to the correct stage.';
                    throw error;
                }
                this._stageGL = targetStage;

            } else if (this._options.useGL === 'new') {
                // create a new WebGL context to run this cache
                this._cacheCanvas = document.createElement('canvas'); // low autopurge in case of filter swapping and low texture count
                this._stageGL = new createjs.StageGL(this._cacheCanvas, {
                    antialias: true,
                    transparent: true,
                    autoPurge: 10,
                });
                if (!this._stageGL._webGLContext) {
                    throw 'GL Cache asked for but unavailable';
                }
                this._stageGL.isCacheControlled = true;	// use this flag to control stage sizing and final output

            } else if (this._options.useGL instanceof createjs.StageGL) {
                // use the provided WebGL context to run this cache, trust the user it works and is configured.
                this._stageGL = this._options.useGL;

            } else {
                throw 'Invalid option provided to useGL, expected [\'stage\', \'new\', StageGL, undefined], got ' + this._options.useGL;
            }
        }

        this.disabled = this._disabled;

        // if we have a dedicated stage we've got to size it
        var stageGL = this._stageGL;
        if (stageGL.isCacheControlled) {
            surface = this._cacheCanvas;
            surface.width = this._drawWidth;
            surface.height = this._drawHeight;
            stageGL.updateViewport(this._drawWidth, this._drawHeight);
        }
    };

    /**
     * Perform the cache draw out for context 2D now that the setup properties have been performed.
     * @method _drawToCache
     * @protected
     **/
    p._drawToCache = function (compositeOperation) {
        var surface = this._cacheCanvas;
        var target = this.target;
        var webGL = this._stageGL;

        if (webGL) {
            webGL.cacheDraw(target, this);
        } else {
            var ctx = surface.getContext('2d');

            if (!compositeOperation) {
                ctx.clearRect(0, 0, this._drawWidth + 1, this._drawHeight + 1);
            }

            ctx.save();
            ctx.globalCompositeOperation = compositeOperation;
            ctx.setTransform(this.scale, 0, 0, this.scale, -this._filterOffX, -this._filterOffY);
            ctx.translate(-this.x, -this.y);
            target.draw(ctx, true);
            ctx.restore();

            if (target.filters && target.filters.length) {
                this._applyFilters(ctx);
            }
        }
        surface._invalid = true;
    };

    /**
     * Work through every filter and apply its individual visual transformation.
     * @method _applyFilters
     * @protected
     **/
    p._applyFilters = function (ctx) {
        var filters = this.target.filters;

        var w = this._drawWidth;
        var h = this._drawHeight;

        var data;

        var i = 0, filter = filters[i];
        do { // this is safe because we wouldn't be in apply filters without a filter count of at least 1
            if (filter.usesContext) {
                if (data) {
                    ctx.putImageData(data, 0, 0);
                    data = null;
                }
                filter.applyFilter(ctx, 0, 0, w, h);
            } else {
                if (!data) {
                    data = ctx.getImageData(0, 0, w, h);
                }
                filter._applyFilter(data);
            }

            // work through the multipass if it's there, otherwise move on
            filter = filter._multiPass !== null ? filter._multiPass : filters[++i];
        } while (filter);

        //done
        if (data) {
            ctx.putImageData(data, 0, 0);
        }
    };

    createjs.BitmapCache = BitmapCache;
}());
