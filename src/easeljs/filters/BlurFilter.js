this.createjs = this.createjs || {};

(function () {
    'use strict';


    function BlurFilter (blurX, blurY, quality) {
        this.Filter_constructor();


        this._blurX = blurX;
        this._blurXTable = [];
        this._lastBlurX = null;


        this._blurY = blurY;
        this._blurYTable = [];
        this._lastBlurY = null;


        this._quality;
        this._lastQuality = null;


        this.FRAG_SHADER_TEMPLATE = (
            'uniform float xWeight[{{blurX}}];' +
            'uniform float yWeight[{{blurY}}];' +
            'uniform vec2 textureOffset;' +
            'void main(void) {' +
            'vec4 color = vec4(0.0);' +

            'float xAdj = ({{blurX}}.0-1.0)/2.0;' +
            'float yAdj = ({{blurY}}.0-1.0)/2.0;' +
            'vec2 sampleOffset;' +

            'for(int i=0; i<{{blurX}}; i++) {' +
            'for(int j=0; j<{{blurY}}; j++) {' +
            'sampleOffset = vTextureCoord + (textureOffset * vec2(float(i)-xAdj, float(j)-yAdj));' +
            'color += texture2D(uSampler, sampleOffset) * (xWeight[i] * yWeight[j]);' +
            '}' +
            '}' +

            'gl_FragColor = color.rgba;' +
            '}'
        );


        if (isNaN(quality) || quality < 1) {
            quality = 1;
        }
        this.setQuality(quality | 0);
    }

    var p = createjs.extend(BlurFilter, createjs.Filter);


    p.getBlurX = function () { return this._blurX; };
    p.getBlurY = function () { return this._blurY; };
    p.setBlurX = function (value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        this._blurX = value;
    };
    p.setBlurY = function (value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        this._blurY = value;
    };
    p.getQuality = function () { return this._quality; };
    p.setQuality = function (value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        this._quality = value | 0;
    };
    p._getShader = function () {
        var xChange = this._lastBlurX !== this._blurX;
        var yChange = this._lastBlurY !== this._blurY;
        var qChange = this._lastQuality !== this._quality;
        if (xChange || yChange || qChange) {
            if (xChange || qChange) {
                this._blurXTable = this._getTable(this._blurX * this._quality);
            }
            if (yChange || qChange) {
                this._blurYTable = this._getTable(this._blurY * this._quality);
            }
            this._updateShader();
            this._lastBlurX = this._blurX;
            this._lastBlurY = this._blurY;
            this._lastQuality = this._quality;
            return undefined;
        }
        return this._compiledShader;
    };
    p._setShader = function (value) { this._compiledShader = value; };

    try {
        Object.defineProperties(p, {
            blurX: { get: p.getBlurX, set: p.setBlurX },
            blurY: { get: p.getBlurY, set: p.setBlurY },
            quality: { get: p.getQuality, set: p.setQuality },
            _builtShader: { get: p._getShader, set: p._setShader },
        });
    } catch (e) {
        console.log(e);
    }


    p._getTable = function (spread) {
        var EDGE = 4.2;
        if (spread <= 1) {
            return [1];
        }

        var result = [];
        var count = Math.ceil(spread * 2);
        count += (count % 2) ? 0 : 1;
        var adjust = (count / 2) | 0;
        for (var i = -adjust; i <= adjust; i++) {
            var x = (i / adjust) * EDGE;
            result.push(1 / Math.sqrt(2 * Math.PI) * Math.pow(Math.E, -(Math.pow(x, 2) / 4)));
        }
        var factor = result.reduce(function (a, b) { return a + b; });
        return result.map(function (currentValue, index, array) { return currentValue / factor; });
    };


    p._updateShader = function () {
        if (this._blurX === undefined || this._blurY === undefined) {
            return;
        }
        var result = this.FRAG_SHADER_TEMPLATE;
        result = result.replace(/\{\{blurX\}\}/g, (this._blurXTable.length).toFixed(0));
        result = result.replace(/\{\{blurY\}\}/g, (this._blurYTable.length).toFixed(0));
        this.FRAG_SHADER_BODY = result;
    };


    p.shaderParamSetup = function (gl, stage, shaderProgram) {

        gl.uniform1fv(
            gl.getUniformLocation(shaderProgram, 'xWeight'),
            this._blurXTable
        );
        gl.uniform1fv(
            gl.getUniformLocation(shaderProgram, 'yWeight'),
            this._blurYTable
        );


        gl.uniform2f(
            gl.getUniformLocation(shaderProgram, 'textureOffset'),
            2 / (stage._viewportWidth * this._quality), 2 / (stage._viewportHeight * this._quality)
        );
    };


    BlurFilter.MUL_TABLE = [1, 171, 205, 293, 57, 373, 79, 137, 241, 27, 391, 357, 41, 19, 283, 265, 497, 469, 443, 421, 25, 191, 365, 349, 335, 161, 155, 149, 9, 278, 269, 261, 505, 245, 475, 231, 449, 437, 213, 415, 405, 395, 193, 377, 369, 361, 353, 345, 169, 331, 325, 319, 313, 307, 301, 37, 145, 285, 281, 69, 271, 267, 263, 259, 509, 501, 493, 243, 479, 118, 465, 459, 113, 446, 55, 435, 429, 423, 209, 413, 51, 403, 199, 393, 97, 3, 379, 375, 371, 367, 363, 359, 355, 351, 347, 43, 85, 337, 333, 165, 327, 323, 5, 317, 157, 311, 77, 305, 303, 75, 297, 294, 73, 289, 287, 71, 141, 279, 277, 275, 68, 135, 67, 133, 33, 262, 260, 129, 511, 507, 503, 499, 495, 491, 61, 121, 481, 477, 237, 235, 467, 232, 115, 457, 227, 451, 7, 445, 221, 439, 218, 433, 215, 427, 425, 211, 419, 417, 207, 411, 409, 203, 202, 401, 399, 396, 197, 49, 389, 387, 385, 383, 95, 189, 47, 187, 93, 185, 23, 183, 91, 181, 45, 179, 89, 177, 11, 175, 87, 173, 345, 343, 341, 339, 337, 21, 167, 83, 331, 329, 327, 163, 81, 323, 321, 319, 159, 79, 315, 313, 39, 155, 309, 307, 153, 305, 303, 151, 75, 299, 149, 37, 295, 147, 73, 291, 145, 289, 287, 143, 285, 71, 141, 281, 35, 279, 139, 69, 275, 137, 273, 17, 271, 135, 269, 267, 133, 265, 33, 263, 131, 261, 130, 259, 129, 257, 1];


    BlurFilter.SHG_TABLE = [0, 9, 10, 11, 9, 12, 10, 11, 12, 9, 13, 13, 10, 9, 13, 13, 14, 14, 14, 14, 10, 13, 14, 14, 14, 13, 13, 13, 9, 14, 14, 14, 15, 14, 15, 14, 15, 15, 14, 15, 15, 15, 14, 15, 15, 15, 15, 15, 14, 15, 15, 15, 15, 15, 15, 12, 14, 15, 15, 13, 15, 15, 15, 15, 16, 16, 16, 15, 16, 14, 16, 16, 14, 16, 13, 16, 16, 16, 15, 16, 13, 16, 15, 16, 14, 9, 16, 16, 16, 16, 16, 16, 16, 16, 16, 13, 14, 16, 16, 15, 16, 16, 10, 16, 15, 16, 14, 16, 16, 14, 16, 16, 14, 16, 16, 14, 15, 16, 16, 16, 14, 15, 14, 15, 13, 16, 16, 15, 17, 17, 17, 17, 17, 17, 14, 15, 17, 17, 16, 16, 17, 16, 15, 17, 16, 17, 11, 17, 16, 17, 16, 17, 16, 17, 17, 16, 17, 17, 16, 17, 17, 16, 16, 17, 17, 17, 16, 14, 17, 17, 17, 17, 15, 16, 14, 16, 15, 16, 13, 16, 15, 16, 14, 16, 15, 16, 12, 16, 15, 16, 17, 17, 17, 17, 17, 13, 16, 15, 17, 17, 17, 16, 15, 17, 17, 17, 16, 15, 17, 17, 14, 16, 17, 17, 16, 17, 17, 16, 15, 17, 16, 14, 17, 16, 15, 17, 16, 17, 17, 16, 17, 15, 16, 17, 14, 17, 16, 15, 17, 16, 17, 13, 17, 16, 17, 17, 16, 17, 14, 17, 16, 17, 16, 17, 16, 17, 9];


    p.getBounds = function (rect) {
        var x = this.blurX | 0, y = this.blurY | 0;
        if (x <= 0 && y <= 0) {
            return rect;
        }
        var q = Math.pow(this.quality, 0.2);
        return (rect || new createjs.Rectangle()).pad(y * q + 1, x * q + 1, y * q + 1, x * q + 1);
    };


    p.clone = function () {
        return new BlurFilter(this.blurX, this.blurY, this.quality);
    };


    p.toString = function () {
        return '[BlurFilter]';
    };


    p._applyFilter = function (imageData) {
        var radiusX = this._blurX >> 1;
        if (isNaN(radiusX) || radiusX < 0) return false;
        var radiusY = this._blurY >> 1;
        if (isNaN(radiusY) || radiusY < 0) return false;
        if (radiusX == 0 && radiusY == 0) return false;

        var iterations = this.quality;
        if (isNaN(iterations) || iterations < 1) iterations = 1;
        iterations |= 0;
        if (iterations > 3) iterations = 3;
        if (iterations < 1) iterations = 1;

        var px = imageData.data;
        var x = 0, y = 0, i = 0, p = 0, yp = 0, yi = 0, yw = 0, r = 0, g = 0, b = 0, a = 0, pr = 0, pg = 0, pb = 0,
            pa = 0;

        var divx = (radiusX + radiusX + 1) | 0;
        var divy = (radiusY + radiusY + 1) | 0;
        var w = imageData.width | 0;
        var h = imageData.height | 0;

        var w1 = (w - 1) | 0;
        var h1 = (h - 1) | 0;
        var rxp1 = (radiusX + 1) | 0;
        var ryp1 = (radiusY + 1) | 0;

        var ssx = { r: 0, b: 0, g: 0, a: 0 };
        var sx = ssx;
        for (i = 1; i < divx; i++) {
            sx = sx.n = { r: 0, b: 0, g: 0, a: 0 };
        }
        sx.n = ssx;

        var ssy = { r: 0, b: 0, g: 0, a: 0 };
        var sy = ssy;
        for (i = 1; i < divy; i++) {
            sy = sy.n = { r: 0, b: 0, g: 0, a: 0 };
        }
        sy.n = ssy;

        var si = null;


        var mtx = BlurFilter.MUL_TABLE[radiusX] | 0;
        var stx = BlurFilter.SHG_TABLE[radiusX] | 0;
        var mty = BlurFilter.MUL_TABLE[radiusY] | 0;
        var sty = BlurFilter.SHG_TABLE[radiusY] | 0;

        while (iterations-- > 0) {

            yw = yi = 0;
            var ms = mtx;
            var ss = stx;
            for (y = h; --y > -1;) {
                r = rxp1 * (pr = px[(yi) | 0]);
                g = rxp1 * (pg = px[(yi + 1) | 0]);
                b = rxp1 * (pb = px[(yi + 2) | 0]);
                a = rxp1 * (pa = px[(yi + 3) | 0]);

                sx = ssx;

                for (i = rxp1; --i > -1;) {
                    sx.r = pr;
                    sx.g = pg;
                    sx.b = pb;
                    sx.a = pa;
                    sx = sx.n;
                }

                for (i = 1; i < rxp1; i++) {
                    p = (yi + ((w1 < i ? w1 : i) << 2)) | 0;
                    r += (sx.r = px[p]);
                    g += (sx.g = px[p + 1]);
                    b += (sx.b = px[p + 2]);
                    a += (sx.a = px[p + 3]);

                    sx = sx.n;
                }

                si = ssx;
                for (x = 0; x < w; x++) {
                    px[yi++] = (r * ms) >>> ss;
                    px[yi++] = (g * ms) >>> ss;
                    px[yi++] = (b * ms) >>> ss;
                    px[yi++] = (a * ms) >>> ss;

                    p = ((yw + ((p = x + radiusX + 1) < w1 ? p : w1)) << 2);

                    r -= si.r - (si.r = px[p]);
                    g -= si.g - (si.g = px[p + 1]);
                    b -= si.b - (si.b = px[p + 2]);
                    a -= si.a - (si.a = px[p + 3]);

                    si = si.n;

                }
                yw += w;
            }

            ms = mty;
            ss = sty;
            for (x = 0; x < w; x++) {
                yi = (x << 2) | 0;

                r = (ryp1 * (pr = px[yi])) | 0;
                g = (ryp1 * (pg = px[(yi + 1) | 0])) | 0;
                b = (ryp1 * (pb = px[(yi + 2) | 0])) | 0;
                a = (ryp1 * (pa = px[(yi + 3) | 0])) | 0;

                sy = ssy;
                for (i = 0; i < ryp1; i++) {
                    sy.r = pr;
                    sy.g = pg;
                    sy.b = pb;
                    sy.a = pa;
                    sy = sy.n;
                }

                yp = w;

                for (i = 1; i <= radiusY; i++) {
                    yi = (yp + x) << 2;

                    r += (sy.r = px[yi]);
                    g += (sy.g = px[yi + 1]);
                    b += (sy.b = px[yi + 2]);
                    a += (sy.a = px[yi + 3]);

                    sy = sy.n;

                    if (i < h1) {
                        yp += w;
                    }
                }

                yi = x;
                si = ssy;
                if (iterations > 0) {
                    for (y = 0; y < h; y++) {
                        p = yi << 2;
                        px[p + 3] = pa = (a * ms) >>> ss;
                        if (pa > 0) {
                            px[p] = ((r * ms) >>> ss);
                            px[p + 1] = ((g * ms) >>> ss);
                            px[p + 2] = ((b * ms) >>> ss);
                        } else {
                            px[p] = px[p + 1] = px[p + 2] = 0;
                        }

                        p = (x + (((p = y + ryp1) < h1 ? p : h1) * w)) << 2;

                        r -= si.r - (si.r = px[p]);
                        g -= si.g - (si.g = px[p + 1]);
                        b -= si.b - (si.b = px[p + 2]);
                        a -= si.a - (si.a = px[p + 3]);

                        si = si.n;

                        yi += w;
                    }
                } else {
                    for (y = 0; y < h; y++) {
                        p = yi << 2;
                        px[p + 3] = pa = (a * ms) >>> ss;
                        if (pa > 0) {
                            pa = 255 / pa;
                            px[p] = ((r * ms) >>> ss) * pa;
                            px[p + 1] = ((g * ms) >>> ss) * pa;
                            px[p + 2] = ((b * ms) >>> ss) * pa;
                        } else {
                            px[p] = px[p + 1] = px[p + 2] = 0;
                        }

                        p = (x + (((p = y + ryp1) < h1 ? p : h1) * w)) << 2;

                        r -= si.r - (si.r = px[p]);
                        g -= si.g - (si.g = px[p + 1]);
                        b -= si.b - (si.b = px[p + 2]);
                        a -= si.a - (si.a = px[p + 3]);

                        si = si.n;

                        yi += w;
                    }
                }
            }

        }
        return true;
    };

    createjs.BlurFilter = createjs.promote(BlurFilter, 'Filter');
}());
