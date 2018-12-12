this.createjs = this.createjs || {};


(function () {
    'use strict';

    function StageGL (canvas, options) {
        this.Stage_constructor(canvas);

        var transparent, antialias, preserveBuffer, autoPurge, directDraw, batchSize;
        if (options !== undefined) {
            if (typeof options !== 'object') {
                throw('Invalid options object');
            }
            transparent = options.transparent;
            antialias = options.antialias;
            preserveBuffer = options.preserveBuffer;
            autoPurge = options.autoPurge;
            directDraw = options.directDraw;
            batchSize = options.batchSize;
        }


        this.vocalDebug = false;


        this.isCacheControlled = false;


        this._preserveBuffer = preserveBuffer || false;


        this._antialias = antialias || false;


        this._transparent = transparent || false;


        this._autoPurge = undefined;
        this.autoPurge = autoPurge;


        this._directDraw = directDraw === undefined ? true : (!!directDraw);


        this._viewportWidth = 0;


        this._viewportHeight = 0;


        this._projectionMatrix = null;


        this._webGLContext = null;


        this._frameBuffer = null;


        this._clearColor = { r: 0.50, g: 0.50, b: 0.50, a: 0.00 };


        this._maxBatchVertexCount = Math.max(
            Math.min(
                Number(batchSize) || StageGL.DEFAULT_MAX_BATCH_SIZE,
                StageGL.DEFAULT_MAX_BATCH_SIZE)
            , StageGL.DEFAULT_MIN_BATCH_SIZE) * StageGL.INDICIES_PER_CARD;


        this._activeShader = null;


        this._mainShader = null;


        this._attributeConfig = {};


        this._activeConfig = null;


        this._bufferTextureOutput = null;


        this._bufferTextureConcat = null;


        this._bufferTextureTemp = null;


        this._batchTextureOutput = this;


        this._batchTextureConcat = null;


        this._batchTextureTemp = null;


        this._builtShaders = {};


        this._textureDictionary = [];


        this._textureIDs = {};


        this._batchTextures = [];


        this._baseTextures = [];


        this._gpuTextureCount = 8;


        this._gpuTextureMax = 8;


        this._batchTextureCount = 0;


        this._lastTextureInsert = -1;


        this._renderMode = '';


        this._immediateRender = false;


        this._batchVertexCount = 0;


        this._batchID = 0;


        this._drawID = 0;


        this._renderPerDraw = 0;


        this._slotBlacklist = [];


        this._lastTrackedCanvas = -1;


        this._cacheContainer = new createjs.Container();


        this._initializeWebGL();


        if (options !== undefined) {
            options.clearColor !== undefined && this.setClearColor(options.clearColor);
            options.premultiply !== undefined && (createjs.deprecate(null, 'options.premultiply')());
        }
    }

    var p = createjs.extend(StageGL, createjs.Stage);


    StageGL.buildUVRects = function (spritesheet, target, onlyTarget) {
        if (!spritesheet || !spritesheet._frames) {
            return null;
        }
        if (target === undefined) {
            target = -1;
        }
        if (onlyTarget === undefined) {
            onlyTarget = false;
        }

        var start = (target !== -1 && onlyTarget) ? (target) : (0);
        var end = (target !== -1 && onlyTarget) ? (target + 1) : (spritesheet._frames.length);
        for (var i = start; i < end; i++) {
            var f = spritesheet._frames[i];
            if (f.uvRect || f.image.width <= 0 || f.image.height <= 0) {
                continue;
            }

            var r = f.rect;
            f.uvRect = {
                t: 1 - (r.y / f.image.height),
                l: r.x / f.image.width,
                b: 1 - ((r.y + r.height) / f.image.height),
                r: (r.x + r.width) / f.image.width,
            };
        }

        return spritesheet._frames[(target !== -1) ? target : 0].uvRect || { t: 0, l: 0, b: 1, r: 1 };
    };


    StageGL.isWebGLActive = function (ctx) {
        return ctx &&
            ctx instanceof WebGLRenderingContext &&
            typeof WebGLRenderingContext !== 'undefined';
    };


    StageGL.colorToObj = function (color) {
        var r, g, b, a;

        if (typeof color === 'string') {
            if (color.indexOf('#') === 0) {
                if (color.length === 4) {
                    color = '#' + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) + color.charAt(3) + color.charAt(3);
                }
                r = Number('0x' + color.slice(1, 3)) / 255;
                g = Number('0x' + color.slice(3, 5)) / 255;
                b = Number('0x' + color.slice(5, 7)) / 255;
                a = color.length > 7 ? Number('0x' + color.slice(7, 9)) / 255 : 1;
            } else if (color.indexOf('rgba(') === 0) {
                var output = color.slice(5, -1).split(',');
                r = Number(output[0]) / 255;
                g = Number(output[1]) / 255;
                b = Number(output[2]) / 255;
                a = Number(output[3]);
            }
        } else {
            r = ((color & 0xFF000000) >>> 24) / 255;
            g = ((color & 0x00FF0000) >>> 16) / 255;
            b = ((color & 0x0000FF00) >>> 8) / 255;
            a = (color & 0x000000FF) / 255;
        }

        return {
            r: Math.min(Math.max(0, r), 1),
            g: Math.min(Math.max(0, g), 1),
            b: Math.min(Math.max(0, b), 1),
            a: Math.min(Math.max(0, a), 1),
        };
    };


    StageGL.VERTEX_PROPERTY_COUNT = 6;


    StageGL.INDICIES_PER_CARD = 6;


    StageGL.DEFAULT_MAX_BATCH_SIZE = 10920;


    StageGL.DEFAULT_MIN_BATCH_SIZE = 170;


    StageGL.WEBGL_MAX_INDEX_NUM = Math.pow(2, 16);


    StageGL.UV_RECT = { t: 1, l: 0, b: 0, r: 1 };

    try {

        StageGL.COVER_VERT = new Float32Array([
            -1, 1,
            1, 1,
            -1, -1,
            1, 1,
            1, -1,
            -1, -1,
        ]);


        StageGL.COVER_UV = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 1,
            1, 0,
            0, 0,
        ]);
    } catch (e) {
    }


    StageGL.REGULAR_VARYING_HEADER = (
        'precision highp float;' +

        'varying vec2 vTextureCoord;' +
        'varying lowp float indexPicker;' +
        'varying lowp float alphaValue;'
    );


    StageGL.REGULAR_VERTEX_HEADER = (
        StageGL.REGULAR_VARYING_HEADER +
        'attribute vec2 vertexPosition;' +
        'attribute vec2 uvPosition;' +
        'attribute lowp float textureIndex;' +
        'attribute lowp float objectAlpha;' +
        'uniform mat4 pMatrix;'
    );


    StageGL.REGULAR_FRAGMENT_HEADER = (
        StageGL.REGULAR_VARYING_HEADER +
        'uniform sampler2D uSampler[{{count}}];'
    );


    StageGL.REGULAR_VERTEX_BODY = (
        'void main(void) {' +
        'gl_Position = pMatrix * vec4(vertexPosition.x, vertexPosition.y, 0.0, 1.0);' +
        'alphaValue = objectAlpha;' +
        'indexPicker = textureIndex;' +
        'vTextureCoord = uvPosition;' +
        '}'
    );


    StageGL.REGULAR_FRAGMENT_BODY = (
        'void main(void) {' +
        'vec4 color = vec4(1.0, 0.0, 0.0, 1.0);' +

        'if (indexPicker <= 0.5) {' +
        'color = texture2D(uSampler[0], vTextureCoord);' +
        '{{alternates}}' +
        '}' +

        'gl_FragColor = vec4(color.rgb * alphaValue, color.a * alphaValue);' +
        '}'
    );


    StageGL.COVER_VARYING_HEADER = (
        'precision highp float;' +

        'varying vec2 vTextureCoord;'
    );


    StageGL.COVER_VERTEX_HEADER = (
        StageGL.COVER_VARYING_HEADER +
        'attribute vec2 vertexPosition;' +
        'attribute vec2 uvPosition;'
    );


    StageGL.COVER_FRAGMENT_HEADER = (
        StageGL.COVER_VARYING_HEADER +
        'uniform sampler2D uSampler;'
    );


    StageGL.COVER_VERTEX_BODY = (
        'void main(void) {' +
        'gl_Position = vec4(vertexPosition.x, vertexPosition.y, 0.0, 1.0);' +
        'vTextureCoord = uvPosition;' +
        '}'
    );


    StageGL.COVER_FRAGMENT_BODY = (
        'void main(void) {' +
        'gl_FragColor = texture2D(uSampler, vTextureCoord);' +
        '}'
    );


    StageGL.BLEND_FRAGMENT_SIMPLE = (
        'uniform sampler2D uMixSampler;' +
        'void main(void) {' +
        'vec4 src = texture2D(uMixSampler, vTextureCoord);' +
        'vec4 dst = texture2D(uSampler, vTextureCoord);'

    );


    StageGL.BLEND_FRAGMENT_COMPLEX = (
        StageGL.BLEND_FRAGMENT_SIMPLE +
        'vec3 srcClr = min(src.rgb/src.a, 1.0);' +
        'vec3 dstClr = min(dst.rgb/dst.a, 1.0);' +

        'float totalAlpha = min(1.0 - (1.0-dst.a) * (1.0-src.a), 1.0);' +
        'float srcFactor = min(max(src.a - dst.a, 0.0) / totalAlpha, 1.0);' +
        'float dstFactor = min(max(dst.a - src.a, 0.0) / totalAlpha, 1.0);' +
        'float mixFactor = max(max(1.0 - srcFactor, 0.0) - dstFactor, 0.0);' +

        'gl_FragColor = vec4(' +
        '(' +
        'srcFactor * srcClr +' +
        'dstFactor * dstClr +' +
        'mixFactor * vec3('

    );


    StageGL.BLEND_FRAGMENT_COMPLEX_CAP = (
        ')' +
        ') * totalAlpha, totalAlpha' +
        ');' +
        '}'
    );


    StageGL.BLEND_FRAGMENT_OVERLAY_UTIL = (
        'float overlay(float a, float b) {' +
        'if(a < 0.5) { return 2.0 * a * b; }' +
        'return 1.0 - 2.0 * (1.0-a) * (1.0-b);' +
        '}'
    );


    StageGL.BLEND_FRAGMENT_HSL_UTIL = (
        'float getLum(vec3 c) { return 0.299*c.r + 0.589*c.g + 0.109*c.b; }' +
        'float getSat(vec3 c) { return max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b); }' +
        'vec3 clipHSL(vec3 c) {' +
        'float lum = getLum(c);' +
        'float n = min(min(c.r, c.g), c.b);' +
        'float x = max(max(c.r, c.g), c.b);' +
        'if(n < 0.0){ c = lum + (((c - lum) * lum) / (lum - n)); }' +
        'if(x > 1.0){ c = lum + (((c - lum) * (1.0 - lum)) / (x - lum)); }' +
        'return clamp(c, 0.0, 1.0);' +
        '}' +
        'vec3 setLum(vec3 c, float lum) {' +
        'return clipHSL(c + (lum - getLum(c)));' +
        '}' +
        'vec3 setSat(vec3 c, float val) {' +
        'vec3 result = vec3(0.0);' +
        'float minVal = min(min(c.r, c.g), c.b);' +
        'float maxVal = max(max(c.r, c.g), c.b);' +
        'vec3 minMask = vec3(c.r == minVal, c.g == minVal, c.b == minVal);' +
        'vec3 maxMask = vec3(c.r == maxVal, c.g == maxVal, c.b == maxVal);' +
        'vec3 midMask = 1.0 - min(minMask+maxMask, 1.0);' +
        'float midVal = (c*midMask).r + (c*midMask).g + (c*midMask).b;' +
        'if(maxVal > minVal) {' +
        'result = midMask * min( ((midVal - minVal) * val) / (maxVal - minVal), 1.0);' +
        'result += maxMask * val;' +
        '}' +
        'return result;' +
        '}'
    );


    StageGL.BLEND_SOURCES = {
        'source-over': {},
        'source-in': {
            shader: (StageGL.BLEND_FRAGMENT_SIMPLE +
                'gl_FragColor = vec4(src.rgb * dst.a, src.a * dst.a);' +
                '}'),
        },
        'source-in_cheap': {
            srcRGB: 'DST_ALPHA', srcA: 'ZERO',
            dstRGB: 'ZERO', dstA: 'SRC_ALPHA',
        },
        'source-out': {
            shader: (StageGL.BLEND_FRAGMENT_SIMPLE +
                'gl_FragColor = vec4(src.rgb * (1.0 - dst.a), src.a - dst.a);' +
                '}'),
        },
        'source-out_cheap': {
            eqA: 'FUNC_SUBTRACT',
            srcRGB: 'ONE_MINUS_DST_ALPHA', srcA: 'ONE',
            dstRGB: 'ZERO', dstA: 'SRC_ALPHA',
        },
        'source-atop': {
            srcRGB: 'DST_ALPHA', srcA: 'ZERO',
            dstRGB: 'ONE_MINUS_SRC_ALPHA', dstA: 'ONE',
        },
        'destination-over': {
            srcRGB: 'ONE_MINUS_DST_ALPHA', srcA: 'ONE_MINUS_DST_ALPHA',
            dstRGB: 'ONE', dstA: 'ONE',
        },
        'destination-in': {
            shader: (StageGL.BLEND_FRAGMENT_SIMPLE +
                'gl_FragColor = vec4(dst.rgb * src.a, src.a * dst.a);' +
                '}'),
        },
        'destination-in_cheap': {
            srcRGB: 'ZERO', srcA: 'DST_ALPHA',
            dstRGB: 'SRC_ALPHA', dstA: 'ZERO',
        },
        'destination-out': {
            eqA: 'FUNC_REVERSE_SUBTRACT',
            srcRGB: 'ZERO', srcA: 'DST_ALPHA',
            dstRGB: 'ONE_MINUS_SRC_ALPHA', dstA: 'ONE',
        },
        'destination-atop': {
            shader: (StageGL.BLEND_FRAGMENT_SIMPLE +
                'gl_FragColor = vec4(dst.rgb * src.a + src.rgb * (1.0 - dst.a), src.a);' +
                '}'),
        },
        'destination-atop_cheap': {
            srcRGB: 'ONE_MINUS_DST_ALPHA', srcA: 'ONE',
            dstRGB: 'SRC_ALPHA', dstA: 'ZERO',
        },
        'copy': {
            shader: (StageGL.BLEND_FRAGMENT_SIMPLE +
                'gl_FragColor = vec4(src.rgb, src.a);' +
                '}'),
        },
        'copy_cheap': {
            dstRGB: 'ZERO', dstA: 'ZERO',
        },
        'xor': {
            shader: (StageGL.BLEND_FRAGMENT_SIMPLE +
                'float omSRC = (1.0 - src.a);' +
                'float omDST = (1.0 - dst.a);' +
                'gl_FragColor = vec4(src.rgb * omDST + dst.rgb * omSRC, src.a * omDST + dst.a * omSRC);'
                + '}'),
        },

        'multiply': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                'srcClr * dstClr'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'multiply_cheap': {
            srcRGB: 'ONE_MINUS_DST_ALPHA', srcA: 'ONE',
            dstRGB: 'SRC_COLOR', dstA: 'ONE',
        },
        'screen': {
            srcRGB: 'ONE', srcA: 'ONE',
            dstRGB: 'ONE_MINUS_SRC_COLOR', dstA: 'ONE_MINUS_SRC_ALPHA',
        },
        'lighter': {
            dstRGB: 'ONE', dstA: 'ONE',
        },
        'lighten': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                'max(srcClr, dstClr)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'darken': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                'min(srcClr, dstClr)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },

        'overlay': {
            shader: (StageGL.BLEND_FRAGMENT_OVERLAY_UTIL + StageGL.BLEND_FRAGMENT_COMPLEX +
                'overlay(dstClr.r,srcClr.r), overlay(dstClr.g,srcClr.g), overlay(dstClr.b,srcClr.b)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'hard-light': {
            shader: (StageGL.BLEND_FRAGMENT_OVERLAY_UTIL + StageGL.BLEND_FRAGMENT_COMPLEX +
                'overlay(srcClr.r,dstClr.r), overlay(srcClr.g,dstClr.g), overlay(srcClr.b,dstClr.b)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'soft-light': {
            shader: (
                'float softcurve(float a) {' +
                'if(a > 0.25) { return sqrt(a); }' +
                'return ((16.0 * a - 12.0) * a + 4.0) * a;' +
                '}' +
                'float softmix(float a, float b) {' +
                'if(b <= 0.5) { return a - (1.0 - 2.0*b) * a * (1.0 - a); }' +
                'return a + (2.0 * b - 1.0) * (softcurve(a) - a);' +
                '}' + StageGL.BLEND_FRAGMENT_COMPLEX +
                'softmix(dstClr.r,srcClr.r), softmix(dstClr.g,srcClr.g), softmix(dstClr.b,srcClr.b)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'color-dodge': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                'clamp(dstClr / (1.0 - srcClr), 0.0, 1.0)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'color-burn': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                '1.0 - clamp((1.0 - smoothstep(0.0035, 0.9955, dstClr)) / smoothstep(0.0035, 0.9955, srcClr), 0.0, 1.0)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'difference': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                'abs(src.rgb - dstClr)'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'exclusion': {
            shader: (StageGL.BLEND_FRAGMENT_COMPLEX +
                'dstClr + src.rgb - 2.0 * src.rgb * dstClr'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },

        'hue': {
            shader: (StageGL.BLEND_FRAGMENT_HSL_UTIL + StageGL.BLEND_FRAGMENT_COMPLEX +
                'setLum(setSat(srcClr, getSat(dstClr)), getLum(dstClr))'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'saturation': {
            shader: (StageGL.BLEND_FRAGMENT_HSL_UTIL + StageGL.BLEND_FRAGMENT_COMPLEX +
                'setLum(setSat(dstClr, getSat(srcClr)), getLum(dstClr))'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'color': {
            shader: (StageGL.BLEND_FRAGMENT_HSL_UTIL + StageGL.BLEND_FRAGMENT_COMPLEX +
                'setLum(srcClr, getLum(dstClr))'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
        'luminosity': {
            shader: (StageGL.BLEND_FRAGMENT_HSL_UTIL + StageGL.BLEND_FRAGMENT_COMPLEX +
                'setLum(dstClr, getLum(srcClr))'
                + StageGL.BLEND_FRAGMENT_COMPLEX_CAP),
        },
    };


    p._get_isWebGL = function () {
        return !!this._webGLContext;
    };

    p._set_autoPurge = function (value) {
        value = isNaN(value) ? 1200 : value;
        if (value !== -1) {
            value = value < 10 ? 10 : value;
        }
        this._autoPurge = value;
    };
    p._get_autoPurge = function () {
        return Number(this._autoPurge);
    };

    try {
        Object.defineProperties(p, {

            isWebGL: { get: p._get_isWebGL },


            autoPurge: { get: p._get_autoPurge, set: p._set_autoPurge },
        });
    } catch (e) {
    }


    p._initializeWebGL = function () {
        if (this.canvas) {
            if (!this._webGLContext || this._webGLContext.canvas !== this.canvas) {


                var options = {
                    depth: false,
                    stencil: false,
                    premultipliedAlpha: this._transparent,

                    alpha: this._transparent,
                    antialias: this._antialias,
                    preserveDrawingBuffer: this._preserveBuffer,
                };

                var gl = this._webGLContext = this._fetchWebGLContext(this.canvas, options);
                if (!gl) {
                    return null;
                }

                gl.disable(gl.DEPTH_TEST);
                gl.depthMask(false);
                gl.enable(gl.BLEND);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.clearColor(0.0, 0.0, 0.0, 0);
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

                this._createBuffers();
                this._initMaterials();
                this._updateRenderMode('source-over');

                this.updateViewport(this.canvas.width, this.canvas.height);
                if (!this._directDraw) {
                    this._bufferTextureOutput = this.getRenderBufferTexture(this._viewportWidth, this._viewportHeight);
                }

                this.canvas._invalid = true;
            }
        } else {
            this._webGLContext = null;
        }
        return this._webGLContext;
    };


    p.update = function (props) {
        if (!this.canvas) {
            return;
        }
        if (this.tickOnUpdate) {
            this.tick(props);
        }
        this.dispatchEvent('drawstart');

        if (this._webGLContext) {
            this.draw(this._webGLContext, false);
        } else {

            if (this.autoClear) {
                this.clear();
            }
            var ctx = this.canvas.getContext('2d');
            ctx.save();
            this.updateContext(ctx);
            this.draw(ctx, false);
            ctx.restore();
        }
        this.dispatchEvent('drawend');
    };


    p.clear = function () {
        if (!this.canvas) {
            return;
        }

        var gl = this._webGLContext;
        if (!StageGL.isWebGLActive(gl)) {
            this.Stage_clear();
            return;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this._clearFrameBuffer(this._transparent ? this._clearColor.a : 1);
    };


    p.draw = function (context, ignoreCache) {
        var gl = this._webGLContext;

        if (!(context === this._webGLContext && StageGL.isWebGLActive(gl))) {
            return this.Stage_draw(context, ignoreCache);
        }

        var storeBatchOutput = this._batchTextureOutput;
        var storeBatchConcat = this._batchTextureConcat;
        var storeBatchTemp = this._batchTextureTemp;


        this._renderPerDraw = 0;
        this._batchVertexCount = 0;
        this._drawID++;

        if (this._directDraw) {
            this._batchTextureOutput = this;
            if (this.autoClear) {
                this.clear();
            }
        } else {
            this._batchTextureOutput = this._bufferTextureOutput;
            this._batchTextureConcat = this._bufferTextureConcat;
            this._batchTextureTemp = this._bufferTextureTemp;
        }

        this._updateRenderMode('source-over');
        this._drawContent(this, ignoreCache);

        if (!this._directDraw) {
            if (this.autoClear) {
                this.clear();
            }
            this.batchReason = 'finalOutput';
            if (this._renderPerDraw) {
                this._drawCover(null, this._batchTextureOutput);
            }
        }


        this._bufferTextureOutput = this._batchTextureOutput;
        this._bufferTextureConcat = this._batchTextureConcat;
        this._bufferTextureTemp = this._batchTextureTemp;

        this._batchTextureOutput = storeBatchOutput;
        this._batchTextureConcat = storeBatchConcat;
        this._batchTextureTemp = storeBatchTemp;

        if (this._autoPurge !== -1 && !(this._drawID % ((this._autoPurge / 2) | 0))) {
            this.purgeTextures(this._autoPurge);
        }

        return true;
    };


    p.cacheDraw = function (target, manager) {

        if (!StageGL.isWebGLActive(this._webGLContext)) {
            return false;
        }

        for (var i = 0; i < this._gpuTextureCount; i++) {
            if (this._batchTextures[i]._frameBuffer) {
                this._batchTextures[i] = this._baseTextures[i];
            }
        }

        var storeBatchOutput = this._batchTextureOutput;
        var storeBatchConcat = this._batchTextureConcat;
        var storeBatchTemp = this._batchTextureTemp;

        var filterCount = manager._filterCount, filtersLeft = filterCount;
        var backupWidth = this._viewportWidth, backupHeight = this._viewportHeight;
        this._updateDrawingSurface(manager._drawWidth, manager._drawHeight);

        this._batchTextureOutput = (manager._filterCount % 2) ? manager._bufferTextureConcat : manager._bufferTextureOutput;
        this._batchTextureConcat = (manager._filterCount % 2) ? manager._bufferTextureOutput : manager._bufferTextureConcat;
        this._batchTextureTemp = manager._bufferTextureTemp;

        var container = this._cacheContainer;
        container.children = [target];
        container.transformMatrix = this._alignTargetToCache(target, manager);

        this._updateRenderMode('source-over');
        this._drawContent(container, true);


        if (this.isCacheControlled) {


            filterCount++;
            filtersLeft++;
        } else if (manager._cacheCanvas !== ((manager._filterCount % 2) ? this._batchTextureConcat : this._batchTextureOutput)) {

            filtersLeft++;
        }

        while (filtersLeft) {
            var filter = manager._getGLFilter(filterCount - (filtersLeft--));
            var swap = this._batchTextureConcat;
            this._batchTextureConcat = this._batchTextureOutput;
            this._batchTextureOutput = (this.isCacheControlled && filtersLeft === 0) ? this : swap;
            this.batchReason = 'filterPass';
            this._drawCover(this._batchTextureOutput._frameBuffer, this._batchTextureConcat, filter);
        }

        manager._bufferTextureOutput = this._batchTextureOutput;
        manager._bufferTextureConcat = this._batchTextureConcat;
        manager._bufferTextureTemp = this._batchTextureTemp;

        this._batchTextureOutput = storeBatchOutput;
        this._batchTextureConcat = storeBatchConcat;
        this._batchTextureTemp = storeBatchTemp;

        this._updateDrawingSurface(backupWidth, backupHeight);
        return true;
    };


    p.releaseTexture = function (item, safe) {
        var i, l;
        if (!item) {
            return;
        }


        if (item.children) {
            for (i = 0, l = item.children.length; i < l; i++) {
                this.releaseTexture(item.children[i], safe);
            }
        }


        if (item.cacheCanvas) {
            item.uncache();
        }

        var foundImage = undefined;
        if (item._storeID !== undefined) {

            if (item === this._textureDictionary[item._storeID]) {
                this._killTextureObject(item);
                item._storeID = undefined;
                return;
            }


            foundImage = item;
        } else if (item._webGLRenderStyle === 2) {

            foundImage = item.image;
        } else if (item._webGLRenderStyle === 1) {

            for (i = 0, l = item.spriteSheet._images.length; i < l; i++) {
                this.releaseTexture(item.spriteSheet._images[i], safe);
            }
            return;
        }


        if (foundImage === undefined) {
            if (this.vocalDebug) {
                console.log('No associated texture found on release');
            }
            return;
        }


        var texture = this._textureDictionary[foundImage._storeID];
        if (safe) {
            var data = texture._imageData;
            var index = data.indexOf(foundImage);
            if (index >= 0) {
                data.splice(index, 1);
            }
            foundImage._storeID = undefined;
            if (data.length === 0) {
                this._killTextureObject(texture);
            }
        } else {
            this._killTextureObject(texture);
        }
    };


    p.purgeTextures = function (count) {
        if (!(count >= 0)) {
            count = 100;
        }

        var dict = this._textureDictionary;
        var l = dict.length;
        for (var i = 0; i < l; i++) {
            var data, texture = dict[i];
            if (!texture || !(data = texture._imageData)) {
                continue;
            }

            for (var j = 0; j < data.length; j++) {
                var item = data[j];
                if (item._drawID + count <= this._drawID) {
                    item._storeID = undefined;
                    data.splice(j, 1);
                    j--;
                }
            }

            if (!data.length) {
                this._killTextureObject(texture);
            }
        }
    };


    p.updateViewport = function (width, height) {
        width = Math.abs(width | 0) || 1;
        height = Math.abs(height | 0) || 1;

        this._updateDrawingSurface(width, height);

        if (this._bufferTextureOutput !== this && this._bufferTextureOutput !== null) {
            this.resizeTexture(this._bufferTextureOutput, this._viewportWidth, this._viewportHeight);
        }
        if (this._bufferTextureConcat !== null) {
            this.resizeTexture(this._bufferTextureConcat, this._viewportWidth, this._viewportHeight);
        }
        if (this._bufferTextureTemp !== null) {
            this.resizeTexture(this._bufferTextureTemp, this._viewportWidth, this._viewportHeight);
        }
    };


    p.getFilterShader = function (filter) {
        if (!filter) {
            filter = this;
        }

        var gl = this._webGLContext;
        var targetShader = this._activeShader;

        if (filter._builtShader) {
            targetShader = filter._builtShader;
            if (filter.shaderParamSetup) {
                gl.useProgram(targetShader);
                filter.shaderParamSetup(gl, this, targetShader);
            }
        } else {
            try {
                targetShader = this._fetchShaderProgram(
                    true, filter.VTX_SHADER_BODY, filter.FRAG_SHADER_BODY,
                    filter.shaderParamSetup && filter.shaderParamSetup.bind(filter)
                );
                filter._builtShader = targetShader;
                targetShader._name = filter.toString();
            } catch (e) {
                console && console.log('SHADER SWITCH FAILURE', e);
            }
        }
        return targetShader;
    };


    p.getBaseTexture = function (w, h) {
        var width = Math.ceil(w > 0 ? w : 1) || 1;
        var height = Math.ceil(h > 0 ? h : 1) || 1;

        var gl = this._webGLContext;
        var texture = gl.createTexture();
        this.resizeTexture(texture, width, height);
        this.setTextureParams(gl, false);

        return texture;
    };


    p.resizeTexture = function (texture, width, height) {
        if (texture.width === width && texture.height === height) {
            return;
        }

        var gl = this._webGLContext;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width, height, 0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );


        texture.width = width;
        texture.height = height;
    };


    p.getRenderBufferTexture = function (w, h) {
        var gl = this._webGLContext;

        var renderTexture = this.getBaseTexture(w, h);
        if (!renderTexture) {
            return null;
        }

        var frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            return null;
        }


        renderTexture.width = w;
        renderTexture.height = h;


        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
        frameBuffer._renderTexture = renderTexture;
        renderTexture._frameBuffer = frameBuffer;


        renderTexture._storeID = this._textureDictionary.length;
        this._textureDictionary[renderTexture._storeID] = renderTexture;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return renderTexture;
    };


    p.setTextureParams = function (gl, isPOT) {
        if (isPOT && this._antialias) {

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };


    p.setClearColor = function (color) {
        this._clearColor = StageGL.colorToObj(color);
    };


    p.toDataURL = function (backgroundColor, mimeType) {
        var dataURL, gl = this._webGLContext;
        this.batchReason = 'dataURL';
        var clearBackup = this._clearColor;

        if (!this.canvas) {
            return;
        }
        if (!StageGL.isWebGLActive(gl)) {
            return this.Stage_toDataURL(backgroundColor, mimeType);
        }


        if (!this._preserveBuffer || backgroundColor !== undefined) {

            if (backgroundColor !== undefined) {
                this._clearColor = StageGL.colorToObj(backgroundColor);
            }
            this.clear();

            if (!this._directDraw) {
                this._drawCover(null, this._bufferTextureOutput);
            } else {
                console.log('No stored/useable gl render info, result may be incorrect if content was changed since render');
                this.draw(gl);
            }
        }


        dataURL = this.canvas.toDataURL(mimeType || 'image/png');


        if (!this._preserveBuffer || backgroundColor !== undefined) {
            if (backgroundColor !== undefined) {
                this._clearColor = clearBackup;
            }
            this.clear();
            if (!this._directDraw) {
                this._drawCover(null, this._bufferTextureOutput);
            } else {
                this.draw(gl);
            }
        }

        return dataURL;
    };


    p.toString = function () {
        return '[StageGL (name=' + this.name + ')]';
    };


    p._updateDrawingSurface = function (w, h) {
        this._viewportWidth = w;
        this._viewportHeight = h;

        this._webGLContext.viewport(0, 0, this._viewportWidth, this._viewportHeight);


        this._projectionMatrix = new Float32Array([
            2 / w, 0, 0, 0,
            0, -2 / h, 0, 0,
            0, 0, 1, 0,
            -1, 1, 0, 1,
        ]);
    };


    p._getSafeTexture = function (w, h) {
        var texture = this.getBaseTexture(w, h);

        if (!texture) {
            var msg = 'Problem creating texture, possible cause: using too much VRAM, please try releasing texture memory';
            (console.error && console.error(msg)) || console.log(msg);

            texture = this._baseTextures[0];
        }

        return texture;
    };


    p._clearFrameBuffer = function (alpha) {
        var gl = this._webGLContext;
        var cc = this._clearColor;

        if (alpha > 0) {
            alpha = 1;
        }
        if (alpha < 0) {
            alpha = 0;
        }


        gl.clearColor(cc.r * alpha, cc.g * alpha, cc.b * alpha, alpha);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearColor(0, 0, 0, 0);
    };


    p._fetchWebGLContext = function (canvas, options) {
        var gl;

        try {
            gl = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
        } catch (e) {

        }

        if (!gl) {
            var msg = 'Could not initialize WebGL';
            console.error ? console.error(msg) : console.log(msg);
        } else {
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        }

        return gl;
    };


    p._fetchShaderProgram = function (coverShader, customVTX, customFRAG, shaderParamSetup) {
        var gl = this._webGLContext;

        gl.useProgram(null);


        var targetFrag, targetVtx;
        if (coverShader) {
            targetVtx = StageGL.COVER_VERTEX_HEADER + (customVTX || StageGL.COVER_VERTEX_BODY);
            targetFrag = StageGL.COVER_FRAGMENT_HEADER + (customFRAG || StageGL.COVER_FRAGMENT_BODY);
        } else {
            targetVtx = StageGL.REGULAR_VERTEX_HEADER + (customVTX || StageGL.REGULAR_VERTEX_BODY);
            targetFrag = StageGL.REGULAR_FRAGMENT_HEADER + (customFRAG || StageGL.REGULAR_FRAGMENT_BODY);
        }


        var vertexShader = this._createShader(gl, gl.VERTEX_SHADER, targetVtx);
        var fragmentShader = this._createShader(gl, gl.FRAGMENT_SHADER, targetFrag);


        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);


        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            gl.useProgram(this._activeShader);
            throw gl.getProgramInfoLog(shaderProgram);
        }


        gl.useProgram(shaderProgram);


        shaderProgram.positionAttribute = gl.getAttribLocation(shaderProgram, 'vertexPosition');
        gl.enableVertexAttribArray(shaderProgram.positionAttribute);

        shaderProgram.uvPositionAttribute = gl.getAttribLocation(shaderProgram, 'uvPosition');
        gl.enableVertexAttribArray(shaderProgram.uvPositionAttribute);

        if (coverShader) {
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
            gl.uniform1i(shaderProgram.samplerUniform, 0);


            if (shaderParamSetup) {
                shaderParamSetup(gl, this, shaderProgram);
            }
        } else {
            shaderProgram.textureIndexAttribute = gl.getAttribLocation(shaderProgram, 'textureIndex');
            gl.enableVertexAttribArray(shaderProgram.textureIndexAttribute);

            shaderProgram.alphaAttribute = gl.getAttribLocation(shaderProgram, 'objectAlpha');
            gl.enableVertexAttribArray(shaderProgram.alphaAttribute);

            var samplers = [];
            for (var i = 0; i < this._gpuTextureCount; i++) {
                samplers[i] = i;
            }
            shaderProgram.samplerData = samplers;

            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, 'uSampler');
            gl.uniform1iv(shaderProgram.samplerUniform, shaderProgram.samplerData);

            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'pMatrix');
        }

        shaderProgram._type = coverShader ? 'cover' : 'batch';

        gl.useProgram(this._activeShader);
        return shaderProgram;
    };


    p._createShader = function (gl, type, str) {
        var textureCount = this._batchTextureCount;


        str = str.replace(/\{\{count}}/g, textureCount);

        if (type === gl.FRAGMENT_SHADER) {


            var insert = '';
            for (var i = 1; i < textureCount; i++) {
                insert += '} else if (indexPicker <= ' + i + '.5) { color = texture2D(uSampler[' + i + '], vTextureCoord);';
            }
            str = str.replace(/\{\{alternates}}/g, insert);
        }


        var shader = gl.createShader(type);
        gl.shaderSource(shader, str);
        gl.compileShader(shader);


        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(shader);
        }

        return shader;
    };


    p._createBuffers = function () {
        var gl = this._webGLContext;
        var groupCount = this._maxBatchVertexCount;
        var groupSize, i, l, config, atrBuffer;


        config = this._attributeConfig['default'] = {};

        groupSize = 2;
        var vertices = new Float32Array(groupCount * groupSize);
        for (i = 0, l = vertices.length; i < l; i += groupSize) {
            vertices[i] = vertices[i + 1] = 0.0;
        }
        atrBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, atrBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        config['position'] = {
            array: vertices,
            buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: 0, offset: 0, offB: 0, size: groupSize,
        };

        groupSize = 2;
        var uvs = new Float32Array(groupCount * groupSize);
        for (i = 0, l = uvs.length; i < l; i += groupSize) {
            uvs[i] = uvs[i + 1] = 0.0;
        }
        atrBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, atrBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW);
        config['uv'] = {
            array: uvs,
            buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: 0, offset: 0, offB: 0, size: groupSize,
        };

        groupSize = 1;
        var indices = new Float32Array(groupCount * groupSize);
        for (i = 0, l = indices.length; i < l; i++) {
            indices[i] = 0.0;
        }
        atrBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, atrBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
        config['texture'] = {
            array: indices,
            buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: 0, offset: 0, offB: 0, size: groupSize,
        };

        groupSize = 1;
        var alphas = new Float32Array(groupCount * groupSize);
        for (i = 0, l = alphas.length; i < l; i++) {
            alphas[i] = 1.0;
        }
        atrBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, atrBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
        config['alpha'] = {
            array: alphas,
            buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: 0, offset: 0, offB: 0, size: groupSize,
        };


        config = this._attributeConfig['micro'] = {};
        groupCount = 5;
        groupSize = 2 + 2 + 1 + 1;
        var stride = groupSize * 4;

        var microArray = new Float32Array(groupCount * groupSize);
        for (i = 0, l = microArray.length; i < l; i += groupSize) {
            microArray[i] = microArray[i + 1] = 0.0;
            microArray[i + 1] = microArray[i + 2] = 0.0;
            microArray[i + 3] = 0.0;
            microArray[i + 4] = 1.0;
        }
        atrBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, atrBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, microArray, gl.DYNAMIC_DRAW);

        config['position'] = {
            array: microArray, buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: stride,
            offset: 0, offB: 0, size: 2,
        };
        config['uv'] = {
            array: microArray, buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: stride,
            offset: 2, offB: 2 * 4, size: 2,
        };
        config['texture'] = {
            array: microArray, buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: stride,
            offset: 4, offB: 4 * 4, size: 1,
        };
        config['alpha'] = {
            array: microArray, buffer: atrBuffer, type: gl.FLOAT, spacing: groupSize, stride: stride,
            offset: 5, offB: 5 * 4, size: 1,
        };


        this._activeConfig = this._attributeConfig['default'];
    };


    p._initMaterials = function () {
        var gl = this._webGLContext;


        this._lastTextureInsert = -1;


        this._textureDictionary = [];
        this._textureIDs = {};
        this._baseTextures = [];
        this._batchTextures = [];

        this._gpuTextureCount = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this._gpuTextureMax = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

        this._batchTextureCount = this._gpuTextureCount;
        var success = false;
        while (!success) {
            try {
                this._activeShader = this._fetchShaderProgram(false);
                success = true;
            } catch (e) {
                if (this._batchTextureCount <= 1) {
                    throw 'Cannot compile shader ' + e;
                }
                this._batchTextureCount = (this._batchTextureCount / 2) | 0;

                if (this.vocalDebug) {
                    console.log('Reducing possible texture count due to errors: ' + this._batchTextureCount);
                }
            }
        }

        this._mainShader = this._activeShader;
        this._mainShader._name = 'main';


        var texture = this.getBaseTexture();
        if (!texture) {
            throw 'Problems creating basic textures, known causes include using too much VRAM by not releasing WebGL texture instances';
        } else {
            texture._storeID = -1;
        }
        for (var i = 0; i < this._batchTextureCount; i++) {
            this._baseTextures[i] = this._batchTextures[i] = texture;
        }
    };


    p._loadTextureImage = function (gl, image) {
        var srcPath, texture, msg;
        if ((image instanceof Image || image instanceof HTMLImageElement) && image.src) {
            srcPath = image.src;
        } else if (image instanceof HTMLCanvasElement) {
            image._isCanvas = true;
            srcPath = 'canvas_' + (++this._lastTrackedCanvas);
        } else {
            msg = 'Invalid image provided as source. Please ensure source is a correct DOM element.';
            (console.error && console.error(msg, image)) || console.log(msg, image);
            return;
        }


        var storeID = this._textureIDs[srcPath];
        if (storeID === undefined) {
            this._textureIDs[srcPath] = storeID = this._textureDictionary.length;
            image._storeID = storeID;
            image._invalid = true;
            texture = this._getSafeTexture();
            this._textureDictionary[storeID] = texture;
        } else {
            image._storeID = storeID;
            texture = this._textureDictionary[storeID];
        }


        if (texture._storeID !== -1) {
            texture._storeID = storeID;
            if (texture._imageData) {
                texture._imageData.push(image);
            } else {
                texture._imageData = [image];
            }
        }


        this._insertTextureInBatch(gl, texture);

        return texture;
    };


    p._updateTextureImageData = function (gl, image) {

        if (!(image.complete || image._isCanvas || image.naturalWidth)) {
            return;
        }


        var isNPOT = (image.width & image.width - 1) || (image.height & image.height - 1);
        var texture = this._textureDictionary[image._storeID];

        gl.activeTexture(gl.TEXTURE0 + texture._activeIndex);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        texture.isPOT = !isNPOT;
        this.setTextureParams(gl, texture.isPOT);

        try {
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        } catch (e) {
            var errString = '\nAn error has occurred. This is most likely due to security restrictions on WebGL images with local or cross-domain origins';
            if (console.error) {

                console.error(errString);
                console.error(e);
            } else if (console) {
                console.log(errString);
                console.log(e);
            }
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        if (image._invalid !== undefined) {
            image._invalid = false;
        }

        texture.width = image.width;
        texture.height = image.height;

        if (this.vocalDebug) {
            if (isNPOT && this._antialias) {
                console.warn('NPOT(Non Power of Two) Texture with context.antialias true: ' + image.src);
            }
            if (image.width > gl.MAX_TEXTURE_SIZE || image.height > gl.MAX_TEXTURE_SIZE) {
                console && console.error('Oversized Texture: ' + image.width + 'x' + image.height + ' vs ' + gl.MAX_TEXTURE_SIZE + 'max');
            }
        }
    };


    p._insertTextureInBatch = function (gl, texture) {
        var image;
        if (this._batchTextures[texture._activeIndex] !== texture) {

            var found = -1;
            var start = (this._lastTextureInsert + 1) % this._batchTextureCount;
            var look = start;
            do {
                if (this._batchTextures[look]._batchID !== this._batchID && !this._slotBlacklist[look]) {
                    found = look;
                    break;
                }
                look = (look + 1) % this._batchTextureCount;
            } while (look !== start);


            if (found === -1) {
                this.batchReason = 'textureOverflow';
                this._renderBatch();
                found = start;
            }


            this._batchTextures[found] = texture;
            texture._activeIndex = found;
            image = texture._imageData && texture._imageData[0];
            if (image && ((image._invalid === undefined && image._isCanvas) || image._invalid)) {
                this._updateTextureImageData(gl, image);
            } else {


            }
            this._lastTextureInsert = found;

        } else if (texture._drawID !== this._drawID) {
            image = texture._imageData && texture._imageData[0];
            if (image && ((image._invalid === undefined && image._isCanvas) || image._invalid)) {
                this._updateTextureImageData(gl, image);
            }
        }

        texture._drawID = this._drawID;
        texture._batchID = this._batchID;
    };


    p._killTextureObject = function (texture) {
        if (!texture) {
            return;
        }
        var gl = this._webGLContext;


        if (texture._storeID !== undefined && texture._storeID >= 0) {
            this._textureDictionary[texture._storeID] = undefined;
            for (var n in this._textureIDs) {
                if (this._textureIDs[n] === texture._storeID) {
                    delete this._textureIDs[n];
                }
            }
            var data = texture._imageData;
            if (data) {
                for (var i = data.length - 1; i >= 0; i--) {
                    data[i]._storeID = undefined;
                }
            }
            texture._imageData = texture._storeID = undefined;
        }


        if (texture._activeIndex !== undefined && this._batchTextures[texture._activeIndex] === texture) {
            this._batchTextures[texture._activeIndex] = this._baseTextures[texture._activeIndex];
        }


        try {
            if (texture._frameBuffer) {
                gl.deleteFramebuffer(texture._frameBuffer);
            }
            texture._frameBuffer = undefined;
        } catch (e) {

            if (this.vocalDebug) {
                console.log(e);
            }
        }


        try {
            gl.deleteTexture(texture);
        } catch (e) {

            if (this.vocalDebug) {
                console.log(e);
            }
        }
    };


    p._setCoverMixShaderParams = function (gl, stage, shaderProgram) {
        gl.uniform1i(
            gl.getUniformLocation(shaderProgram, 'uMixSampler'),
            1
        );
    };


    p._updateRenderMode = function (newMode) {
        if (newMode === null || newMode === undefined) {
            newMode = 'source-over';
        }

        var blendSrc = StageGL.BLEND_SOURCES[newMode];
        if (blendSrc === undefined) {
            if (this.vocalDebug) {
                console.log('Unknown compositeOperation [' + newMode + '], reverting to default');
            }
            blendSrc = StageGL.BLEND_SOURCES[newMode = 'source-over'];
        }

        if (this._renderMode === newMode) {
            return;
        }

        var gl = this._webGLContext;
        var shaderData = this._builtShaders[newMode];
        if (shaderData === undefined) {
            try {
                shaderData = this._builtShaders[newMode] = {
                    eqRGB: gl[blendSrc.eqRGB || 'FUNC_ADD'],
                    srcRGB: gl[blendSrc.srcRGB || 'ONE'],
                    dstRGB: gl[blendSrc.dstRGB || 'ONE_MINUS_SRC_ALPHA'],
                    eqA: gl[blendSrc.eqA || 'FUNC_ADD'],
                    srcA: gl[blendSrc.srcA || 'ONE'],
                    dstA: gl[blendSrc.dstA || 'ONE_MINUS_SRC_ALPHA'],
                    immediate: blendSrc.shader !== undefined,
                    shader: (blendSrc.shader || this._builtShaders['source-over'] === undefined) ?
                        this._fetchShaderProgram(
                            true, undefined, blendSrc.shader,
                            this._setCoverMixShaderParams
                        ) : this._builtShaders['source-over'].shader,
                };
                if (blendSrc.shader) {
                    shaderData.shader._name = newMode;
                }
            } catch (e) {
                this._builtShaders[newMode] = undefined;
                console && console.log('SHADER SWITCH FAILURE', e);
                return;
            }
        }

        if (shaderData.immediate) {
            if (this._directDraw) {
                if (this.vocalDebug) {
                    console.log('Illegal compositeOperation [' + newMode + '] due to StageGL.directDraw = true, reverting to default');
                }
                return;
            }
            this._activeConfig = this._attributeConfig['micro'];
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureOutput._frameBuffer);

        this.batchReason = 'shaderSwap';
        this._renderBatch();

        this._renderMode = newMode;
        this._immediateRender = shaderData.immediate;
        gl.blendEquationSeparate(shaderData.eqRGB, shaderData.eqA);
        gl.blendFuncSeparate(shaderData.srcRGB, shaderData.dstRGB, shaderData.srcA, shaderData.dstA);
    };


    p._drawContent = function (content, ignoreCache) {
        var gl = this._webGLContext;

        this._activeShader = this._mainShader;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureOutput._frameBuffer);
        if (this._batchTextureOutput._frameBuffer !== null) {
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        this._appendToBatch(content, new createjs.Matrix2D(), this.alpha, ignoreCache);

        this.batchReason = 'contentEnd';
        this._renderBatch();
    };


    p._drawCover = function (out, dst, srcFilter) {
        var gl = this._webGLContext;

        gl.bindFramebuffer(gl.FRAMEBUFFER, out);
        if (out !== null) {
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dst);
        this.setTextureParams(gl);

        if (srcFilter instanceof createjs.Filter) {
            this._activeShader = this.getFilterShader(srcFilter);
        } else {
            if (srcFilter instanceof WebGLTexture) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, srcFilter);
                this.setTextureParams(gl);
            } else if (srcFilter !== undefined && this.vocalDebug) {
                console.log('Unknown data handed to function: ', srcFilter);
            }
            this._activeShader = this._builtShaders[this._renderMode].shader;
        }

        this._renderCover();
    };


    p._alignTargetToCache = function (target, manager) {
        if (manager._counterMatrix === null) {
            manager._counterMatrix = target.getMatrix();
        } else {
            target.getMatrix(manager._counterMatrix);
        }

        var mtx = manager._counterMatrix;
        mtx.scale(1 / manager.scale, 1 / manager.scale);
        mtx = mtx.invert();
        mtx.translate(-manager.offX / manager.scale * target.scaleX, -manager.offY / manager.scale * target.scaleY);

        return mtx;
    };


    p._appendToBatch = function (container, concatMtx, concatAlpha, ignoreCache) {
        var gl = this._webGLContext;


        var cMtx = container._glMtx;
        cMtx.copy(concatMtx);
        if (container.transformMatrix !== null) {
            cMtx.appendMatrix(container.transformMatrix);
        } else {
            cMtx.appendTransform(
                container.x, container.y,
                container.scaleX, container.scaleY,
                container.rotation, container.skewX, container.skewY,
                container.regX, container.regY
            );
        }

        var previousRenderMode = this._renderMode;
        if (container.compositeOperation) {
            this._updateRenderMode(container.compositeOperation);
        }


        var subL, subT, subR, subB;


        var l = container.children.length;
        for (var i = 0; i < l; i++) {
            var item = container.children[i];
            var useCache = (!ignoreCache && item.cacheCanvas) || false;

            if (!(item.visible && concatAlpha > 0.0035)) {
                continue;
            }
            var itemAlpha = item.alpha;

            if (useCache === false) {
                if (item._updateState) {
                    item._updateState();
                }

                if (!this._directDraw && (!ignoreCache && item.cacheCanvas === null && item.filters !== null && item.filters.length)) {
                    var bounds;
                    if (item.bitmapCache === null) {
                        bounds = item.getBounds();
                        item.bitmapCache = new createjs.BitmapCache();
                        item.bitmapCache._autoGenerated = true;
                    }
                    if (item.bitmapCache._autoGenerated) {
                        this.batchReason = 'cachelessFilterInterupt';
                        this._renderBatch();

                        item.alpha = 1;
                        var shaderBackup = this._activeShader;
                        bounds = bounds || item.getBounds();
                        item.bitmapCache.define(item, bounds.x, bounds.y, bounds.width, bounds.height, 1, { useGL: this });
                        useCache = item.bitmapCache._cacheCanvas;

                        item.alpha = itemAlpha;
                        this._activeShader = shaderBackup;
                        gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureOutput._frameBuffer);
                    }
                }
            }

            if (useCache === false && item.children) {
                this._appendToBatch(item, cMtx, itemAlpha * concatAlpha);
                continue;
            }

            var containerRenderMode = this._renderMode;
            if (item.compositeOperation) {
                this._updateRenderMode(item.compositeOperation);
            }


            if (this._batchVertexCount + StageGL.INDICIES_PER_CARD > this._maxBatchVertexCount) {
                this.batchReason = 'vertexOverflow';
                this._renderBatch();
            }


            var iMtx = item._glMtx;
            iMtx.copy(cMtx);
            if (item.transformMatrix) {
                iMtx.appendMatrix(item.transformMatrix);
            } else {
                iMtx.appendTransform(
                    item.x, item.y,
                    item.scaleX, item.scaleY,
                    item.rotation, item.skewX, item.skewY,
                    item.regX, item.regY
                );
            }

            var uvRect, texIndex, image, frame, texture, src;


            if (item._webGLRenderStyle === 2 || useCache !== false) {
                image = useCache === false ? item.image : useCache;


            } else if (item._webGLRenderStyle === 1) {
                frame = item.spriteSheet.getFrame(item.currentFrame);
                if (frame === null) {
                    continue;
                }
                image = frame.image;


            } else {
                continue;
            }
            if (!image) {
                continue;
            }


            if (image._storeID === undefined) {

                texture = this._loadTextureImage(gl, image);
            } else {

                texture = this._textureDictionary[image._storeID];

                if (!texture) {
                    if (this.vocalDebug) {
                        console.log('Image source should not be lookup a non existent texture, please report a bug.');
                    }
                    continue;
                }


                if (texture._batchID !== this._batchID) {
                    this._insertTextureInBatch(gl, texture);
                }
            }
            texIndex = texture._activeIndex;
            image._drawID = this._drawID;


            if (item._webGLRenderStyle === 2 || useCache !== false) {
                if (useCache === false && item.sourceRect) {

                    if (!item._uvRect) {
                        item._uvRect = {};
                    }
                    src = item.sourceRect;
                    uvRect = item._uvRect;
                    uvRect.t = 1 - ((src.y) / image.height);
                    uvRect.l = (src.x) / image.width;
                    uvRect.b = 1 - ((src.y + src.height) / image.height);
                    uvRect.r = (src.x + src.width) / image.width;


                    subL = 0;
                    subT = 0;
                    subR = src.width + subL;
                    subB = src.height + subT;
                } else {

                    uvRect = StageGL.UV_RECT;

                    if (useCache === false) {
                        subL = 0;
                        subT = 0;
                        subR = image.width + subL;
                        subB = image.height + subT;
                    } else {
                        src = item.bitmapCache;
                        subL = src.x + (src._filterOffX / src.scale);
                        subT = src.y + (src._filterOffY / src.scale);
                        subR = (src._drawWidth / src.scale) + subL;
                        subB = (src._drawHeight / src.scale) + subT;
                    }
                }


            } else if (item._webGLRenderStyle === 1) {
                var rect = frame.rect;


                uvRect = frame.uvRect;
                if (!uvRect) {
                    uvRect = StageGL.buildUVRects(item.spriteSheet, item.currentFrame, false);
                }


                subL = -frame.regX;
                subT = -frame.regY;
                subR = rect.width - frame.regX;
                subB = rect.height - frame.regY;
            }

            var spacing = 0;
            var cfg = this._activeConfig;
            var vpos = cfg.position.array;
            var uvs = cfg.uv.array;
            var texI = cfg.texture.array;
            var alphas = cfg.alpha.array;


            spacing = cfg.position.spacing;
            var vtxOff = this._batchVertexCount * spacing + cfg.position.offset;
            vpos[vtxOff] = subL * iMtx.a + subT * iMtx.c + iMtx.tx;
            vpos[vtxOff + 1] = subL * iMtx.b + subT * iMtx.d + iMtx.ty;
            vtxOff += spacing;
            vpos[vtxOff] = subL * iMtx.a + subB * iMtx.c + iMtx.tx;
            vpos[vtxOff + 1] = subL * iMtx.b + subB * iMtx.d + iMtx.ty;
            vtxOff += spacing;
            vpos[vtxOff] = subR * iMtx.a + subT * iMtx.c + iMtx.tx;
            vpos[vtxOff + 1] = subR * iMtx.b + subT * iMtx.d + iMtx.ty;
            vtxOff += spacing;
            vpos[vtxOff] = subL * iMtx.a + subB * iMtx.c + iMtx.tx;
            vpos[vtxOff + 1] = subL * iMtx.b + subB * iMtx.d + iMtx.ty;
            vtxOff += spacing;
            vpos[vtxOff] = subR * iMtx.a + subT * iMtx.c + iMtx.tx;
            vpos[vtxOff + 1] = subR * iMtx.b + subT * iMtx.d + iMtx.ty;
            vtxOff += spacing;
            vpos[vtxOff] = subR * iMtx.a + subB * iMtx.c + iMtx.tx;
            vpos[vtxOff + 1] = subR * iMtx.b + subB * iMtx.d + iMtx.ty;


            spacing = cfg.uv.spacing;
            var uvOff = this._batchVertexCount * spacing + cfg.uv.offset;
            uvs[uvOff] = uvRect.l;
            uvs[uvOff + 1] = uvRect.t;
            uvOff += spacing;
            uvs[uvOff] = uvRect.l;
            uvs[uvOff + 1] = uvRect.b;
            uvOff += spacing;
            uvs[uvOff] = uvRect.r;
            uvs[uvOff + 1] = uvRect.t;
            uvOff += spacing;
            uvs[uvOff] = uvRect.l;
            uvs[uvOff + 1] = uvRect.b;
            uvOff += spacing;
            uvs[uvOff] = uvRect.r;
            uvs[uvOff + 1] = uvRect.t;
            uvOff += spacing;
            uvs[uvOff] = uvRect.r;
            uvs[uvOff + 1] = uvRect.b;


            spacing = cfg.texture.spacing;
            var texOff = this._batchVertexCount * spacing + cfg.texture.offset;
            texI[texOff] = texIndex;
            texOff += spacing;
            texI[texOff] = texIndex;
            texOff += spacing;
            texI[texOff] = texIndex;
            texOff += spacing;
            texI[texOff] = texIndex;
            texOff += spacing;
            texI[texOff] = texIndex;
            texOff += spacing;
            texI[texOff] = texIndex;


            spacing = cfg.alpha.spacing;
            var aOff = this._batchVertexCount * spacing + cfg.alpha.offset;
            alphas[aOff] = itemAlpha * concatAlpha;
            aOff += spacing;
            alphas[aOff] = itemAlpha * concatAlpha;
            aOff += spacing;
            alphas[aOff] = itemAlpha * concatAlpha;
            aOff += spacing;
            alphas[aOff] = itemAlpha * concatAlpha;
            aOff += spacing;
            alphas[aOff] = itemAlpha * concatAlpha;
            aOff += spacing;
            alphas[aOff] = itemAlpha * concatAlpha;

            this._batchVertexCount += StageGL.INDICIES_PER_CARD;

            if (this._immediateRender) {
                this._activeConfig = this._attributeConfig['default'];
                this._immediateBatchRender();
            }

            if (this._renderMode !== containerRenderMode) {
                this._updateRenderMode(containerRenderMode);
            }
        }

        if (this._renderMode !== previousRenderMode) {
            this._updateRenderMode(previousRenderMode);
        }
    };


    p._immediateBatchRender = function () {
        var gl = this._webGLContext;

        if (this._batchTextureConcat === null) {
            this._batchTextureConcat = this.getRenderBufferTexture(this._viewportWidth, this._viewportHeight);
        } else {
            this.resizeTexture(this._batchTextureConcat, this._viewportWidth, this._viewportHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureConcat._frameBuffer);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        if (this._batchTextureTemp === null) {
            this._batchTextureTemp = this.getRenderBufferTexture(this._viewportWidth, this._viewportHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureTemp._frameBuffer);
        } else {
            this.resizeTexture(this._batchTextureTemp, this._viewportWidth, this._viewportHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureTemp._frameBuffer);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        var swap = this._batchTextureOutput;
        this._batchTextureOutput = this._batchTextureConcat;
        this._batchTextureConcat = swap;

        this._activeShader = this._mainShader;
        this.batchReason = 'immediatePrep';
        this._renderBatch();

        this.batchReason = 'immediateResults';
        this._drawCover(this._batchTextureOutput._frameBuffer, this._batchTextureConcat, this._batchTextureTemp);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureOutput._frameBuffer);
    };


    p._renderBatch = function () {
        if (this._batchVertexCount <= 0) {
            return;
        }
        var gl = this._webGLContext;
        this._renderPerDraw++;

        if (this.vocalDebug) {
            console.log('Batch[' + this._drawID + ':' + this._batchID + '] : ' + this.batchReason);
        }
        var shaderProgram = this._activeShader;
        var pc, config = this._activeConfig;

        gl.useProgram(shaderProgram);

        pc = config.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.buffer);
        gl.vertexAttribPointer(shaderProgram.positionAttribute, pc.size, pc.type, false, pc.stride, pc.offB);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pc.array);

        pc = config.texture;
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.buffer);
        gl.vertexAttribPointer(shaderProgram.textureIndexAttribute, pc.size, pc.type, false, pc.stride, pc.offB);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pc.array);

        pc = config.uv;
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.buffer);
        gl.vertexAttribPointer(shaderProgram.uvPositionAttribute, pc.size, pc.type, false, pc.stride, pc.offB);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pc.array);

        pc = config.alpha;
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.buffer);
        gl.vertexAttribPointer(shaderProgram.alphaAttribute, pc.size, pc.type, false, pc.stride, pc.offB);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pc.array);

        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, gl.FALSE, this._projectionMatrix);

        for (var i = 0; i < this._batchTextureCount; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, this._batchTextures[i]);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this._batchVertexCount);

        this._batchVertexCount = 0;
        this._batchID++;
    };


    p._renderCover = function () {
        var gl = this._webGLContext;
        this._renderPerDraw++;

        if (this.vocalDebug) {
            console.log('Cover[' + this._drawID + ':' + this._batchID + '] : ' + this.batchReason);
        }
        var shaderProgram = this._activeShader;
        var pc, config = this._attributeConfig.default;

        gl.useProgram(shaderProgram);

        pc = config.position;
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.buffer);
        gl.vertexAttribPointer(shaderProgram.positionAttribute, pc.size, pc.type, false, pc.stride, pc.offB);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, StageGL.COVER_VERT);

        pc = config.uv;
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.buffer);
        gl.vertexAttribPointer(shaderProgram.uvPositionAttribute, pc.size, pc.type, false, pc.stride, pc.offB);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, StageGL.COVER_UV);

        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.drawArrays(gl.TRIANGLES, 0, StageGL.INDICIES_PER_CARD);
        this._batchID++;
    };

    createjs.StageGL = createjs.promote(StageGL, 'Stage');
}());
