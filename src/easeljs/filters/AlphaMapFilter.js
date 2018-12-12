this.createjs = this.createjs || {};

(function () {
    'use strict';


    function AlphaMapFilter (alphaMap) {
        this.Filter_constructor();

        if (!createjs.Filter.isValidImageSource(alphaMap)) {
            throw 'Must provide valid image source for alpha map, see Filter.isValidImageSource';
        }


        this.alphaMap = alphaMap;


        this._map = null;


        this._mapCtx = null;


        this._mapTexture = null;

        this.FRAG_SHADER_BODY = (
            'uniform sampler2D uAlphaSampler;' +

            'void main(void) {' +
            'vec4 color = texture2D(uSampler, vTextureCoord);' +
            'vec4 alphaMap = texture2D(uAlphaSampler, vTextureCoord);' +


            'float newAlpha = alphaMap.r * ceil(alphaMap.a);' +
            'gl_FragColor = vec4(clamp(color.rgb/color.a, 0.0, 1.0) * newAlpha, newAlpha);' +
            '}'
        );

        if (alphaMap instanceof WebGLTexture) {
            this._mapTexture = alphaMap;
        }
    }

    var p = createjs.extend(AlphaMapFilter, createjs.Filter);


    p.shaderParamSetup = function (gl, stage, shaderProgram) {
        if (this._mapTexture === null) {
            this._mapTexture = gl.createTexture();
        }

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._mapTexture);
        stage.setTextureParams(gl);
        if (this.alphaMap !== this._mapTexture) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.alphaMap);
        }

        gl.uniform1i(
            gl.getUniformLocation(shaderProgram, 'uAlphaSampler'),
            1
        );
    };


    p.clone = function () {
        var o = new AlphaMapFilter(this.alphaMap);
        return o;
    };


    p.toString = function () {
        return '[AlphaMapFilter]';
    };


    p._applyFilter = function (imageData) {
        if (!this._prepAlphaMap()) {
            return false;
        }

        var outArray = imageData.data;
        var width = imageData.width;
        var height = imageData.height;
        var rowOffset, pixelStart;

        var sampleData = this._mapCtx.getImageData(0, 0, this._map.width, this._map.height);
        var sampleArray = sampleData.data;
        var sampleWidth = sampleData.width;
        var sampleHeight = sampleData.height;
        var sampleRowOffset, samplePixelStart;

        var widthRatio = sampleWidth / width;
        var heightRatio = sampleHeight / height;


        for (var i = 0; i < height; i++) {
            rowOffset = i * width;
            sampleRowOffset = ((i * heightRatio) | 0) * sampleWidth;


            for (var j = 0; j < width; j++) {
                pixelStart = (rowOffset + j) * 4;
                samplePixelStart = (sampleRowOffset + ((j * widthRatio) | 0)) * 4;


                outArray[pixelStart] = outArray[pixelStart];
                outArray[pixelStart + 1] = outArray[pixelStart + 1];
                outArray[pixelStart + 2] = outArray[pixelStart + 2];
                outArray[pixelStart + 3] = sampleArray[samplePixelStart];
            }
        }

        return true;
    };


    p._prepAlphaMap = function () {
        if (!this.alphaMap) {
            return false;
        }
        if (this.alphaMap === this._map && this._mapCtx) {
            return true;
        }

        var map = this._map = this.alphaMap;
        var canvas = map;
        var ctx;
        if (map instanceof HTMLCanvasElement) {
            ctx = canvas.getContext('2d');
        } else {
            canvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas');
            canvas.width = map.width;
            canvas.height = map.height;
            ctx = canvas.getContext('2d');
            ctx.drawImage(map, 0, 0);
        }

        this._mapCtx = ctx;

        return true;
    };


    createjs.AlphaMapFilter = createjs.promote(AlphaMapFilter, 'Filter');
}());
