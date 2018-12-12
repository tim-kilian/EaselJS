this.createjs = this.createjs || {};

(function () {
    'use strict';


    function DisplacementFilter (dudvMap, distance) {
        this.Filter_constructor();

        if (!createjs.Filter.isValidImageSource(dudvMap)) {
            throw 'Must provide valid image source for displacement map, see Filter.isValidImageSource';
        }


        this.dudvMap = dudvMap;


        this.distance = Number(distance);
        if (isNaN(this.distance)) {
            this.distance = 128;
        }


        this.FRAG_SHADER_BODY = (
            'uniform sampler2D uDudvSampler;' +
            'uniform float fPower;' +
            'uniform vec2 pixelAdjustment;' +

            'void main(void) {' +
            'vec4 dudvValue = texture2D(uDudvSampler, vTextureCoord);' +
            'vec2 sampleOffset = mix(vec2(0.0), dudvValue.rg-0.5, dudvValue.a) * (fPower*pixelAdjustment);' +
            'gl_FragColor = texture2D(uSampler, vTextureCoord + sampleOffset);' +
            '}'
        );

        if (dudvMap instanceof WebGLTexture) {
            this._mapTexture = dudvMap;
        } else if (dudvMap instanceof HTMLCanvasElement) {
            this._dudvCanvas = dudvMap;
            this._dudvCtx = dudvMap.getContext('2d');
        } else {
            var canvas = this._dudvCanvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas');
            canvas.width = dudvMap.width;
            canvas.height = dudvMap.height;
            (this._dudvCtx = canvas.getContext('2d')).drawImage(dudvMap, 0, 0);
        }
    }

    var p = createjs.extend(DisplacementFilter, createjs.Filter);


    p.shaderParamSetup = function (gl, stage, shaderProgram) {
        if (!this._mapTexture) {
            this._mapTexture = gl.createTexture();
        }

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._mapTexture);
        stage.setTextureParams(gl);
        if (this.dudvMap !== this._mapTexture) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.dudvMap);
        }

        gl.uniform1i(
            gl.getUniformLocation(shaderProgram, 'uDudvSampler'),
            1
        );

        gl.uniform1f(
            gl.getUniformLocation(shaderProgram, 'fPower'),
            this.distance
        );

        gl.uniform2f(
            gl.getUniformLocation(shaderProgram, 'pixelAdjustment'),
            2 / stage._viewportWidth, -2 / stage._viewportHeight
        );
    };


    p._applyFilter = function (imageData) {


        var refArray, refArraySrc = imageData.data;
        if (refArraySrc.slice !== undefined) {
            refArray = refArraySrc.slice();
        } else {
            refArray = new Uint8ClampedArray(refArraySrc.length);
            refArray.set(refArraySrc);
        }

        var outArray = imageData.data;
        var width = imageData.width;
        var height = imageData.height;
        var rowOffset, pixelStart;

        var sampleData = this._dudvCtx.getImageData(0, 0, this.dudvMap.width, this.dudvMap.height);
        var sampleArray = sampleData.data;
        var sampleWidth = sampleData.width;
        var sampleHeight = sampleData.height;
        var sampleRowOffset, samplePixelStart;

        var widthRatio = sampleWidth / width;
        var heightRatio = sampleHeight / height;
        var pxRange = 1 / 255;


        var distance = this.distance * 2;


        for (var i = 0; i < height; i++) {
            rowOffset = i * width;
            sampleRowOffset = ((i * heightRatio) | 0) * sampleWidth;


            for (var j = 0; j < width; j++) {
                pixelStart = (rowOffset + j) * 4;
                samplePixelStart = (sampleRowOffset + ((j * widthRatio) | 0)) * 4;


                var deltaPower = sampleArray[samplePixelStart + 3] * pxRange * distance;
                var xDelta = ((sampleArray[samplePixelStart] * pxRange - 0.5) * deltaPower) | 0;
                var yDelta = ((sampleArray[samplePixelStart + 1] * pxRange - 0.5) * deltaPower) | 0;

                if (j + xDelta < 0) {
                    xDelta = -j;
                }
                if (j + xDelta > width) {
                    xDelta = width - j;
                }
                if (i + yDelta < 0) {
                    yDelta = -i;
                }
                if (i + yDelta > height) {
                    yDelta = height - i;
                }

                var targetPixelStart = (pixelStart + xDelta * 4) + yDelta * 4 * width;
                outArray[pixelStart] = refArray[targetPixelStart];
                outArray[pixelStart + 1] = refArray[targetPixelStart + 1];
                outArray[pixelStart + 2] = refArray[targetPixelStart + 2];
                outArray[pixelStart + 3] = refArray[targetPixelStart + 3];
            }
        }

        return true;
    };

    createjs.DisplacementFilter = createjs.promote(DisplacementFilter, 'Filter');
}());
