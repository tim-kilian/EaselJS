(function () {
    'use strict';


    function AberrationFilter (xDir, yDir, redMultiplier, greenMultiplier, blueMultiplier, originalMix, alphaMax) {
        this.Filter_constructor();


        this.xDir = Number(xDir) || 0;
        this.yDir = Number(yDir) || 0;

        this.redMultiplier = Number(redMultiplier) || 0;
        this.greenMultiplier = Number(greenMultiplier) || 0;
        this.blueMultiplier = Number(blueMultiplier) || 0;

        this.originalMix = Math.min(Math.max(originalMix, 0), 1) || 0;
        this._alphaMax = Boolean(alphaMax);

        this.FRAG_SHADER_BODY = (
            'uniform vec2 uColorDirection;' +
            'uniform vec3 uColorMultiplier;' +
            'uniform vec2 uExtraProps;' +

            'void main(void) {' +
            'vec4 sample = texture2D(' +
            'uSampler, ' +
            'vTextureCoord' +
            ');' +
            'vec4 rSample = texture2D(' +
            'uSampler, ' +
            'vTextureCoord + (uColorDirection * uColorMultiplier.r)' +
            ');' +
            'vec4 gSample = texture2D(' +
            'uSampler, ' +
            'vTextureCoord + (uColorDirection * uColorMultiplier.g)' +
            ');' +
            'vec4 bSample = texture2D(' +
            'uSampler, ' +
            'vTextureCoord + (uColorDirection * uColorMultiplier.b)' +
            ');' +

            'float newAlpha = ' + (alphaMax ?
                    'max(rSample.a, max(gSample.a, max(bSample.a, sample.a)))' :
                    '(rSample.a + gSample.a + bSample.a) / 3.0'
            ) + ';' +
            'vec4 result = vec4(' +
            'min(1.0, rSample.r/(rSample.a+0.00001)) * newAlpha, ' +
            'min(1.0, gSample.g/(gSample.a+0.00001)) * newAlpha, ' +
            'min(1.0, bSample.b/(bSample.a+0.00001)) * newAlpha, ' +
            'newAlpha' +
            ');' +
            'gl_FragColor = mix(result, sample, uExtraProps[0]*sample.a);' +
            '}'
        );

    }

    var p = createjs.extend(AberrationFilter, createjs.Filter);


    p.shaderParamSetup = function (gl, stage, shaderProgram) {

        gl.uniform2f(
            gl.getUniformLocation(shaderProgram, 'uColorDirection'),
            this.xDir * (1 / stage._viewportWidth), this.yDir * (1 / -stage._viewportHeight)
        );

        gl.uniform3f(
            gl.getUniformLocation(shaderProgram, 'uColorMultiplier'),
            -this.redMultiplier,
            -this.greenMultiplier,
            -this.blueMultiplier
        );

        gl.uniform2f(
            gl.getUniformLocation(shaderProgram, 'uExtraProps'),
            this.originalMix, 0
        );
    };


    p._applyFilter = function (imageData) {
        var refPixels = imageData.data.slice();
        var outPixels = imageData.data;
        var width = imageData.width;
        var height = imageData.height;
        var offset, pixel;

        for (var i = 0; i < height; i++) {
            offset = i * width;
            for (var j = 0; j < width; j++) {
                pixel = (offset + j) * 4;

                var redX = j + ((this.xDir * -this.redMultiplier) | 0),
                    redY = i + ((this.yDir * -this.redMultiplier) | 0);
                var grnX = j + ((this.xDir * -this.greenMultiplier) | 0),
                    grnY = i + ((this.yDir * -this.greenMultiplier) | 0);
                var bluX = j + ((this.xDir * -this.blueMultiplier) | 0),
                    bluY = i + ((this.yDir * -this.blueMultiplier) | 0);

                if (redX < 0) {
                    redX = 0;
                }
                if (redX >= width) {
                    redX = width - 1;
                }
                if (redY < 0) {
                    redY = 0;
                }
                if (redY >= height) {
                    redY = height - 1;
                }

                if (grnX < 0) {
                    grnX = 0;
                }
                if (grnX >= width) {
                    grnX = width - 1;
                }
                if (grnY < 0) {
                    grnY = 0;
                }
                if (grnY >= height) {
                    grnY = height - 1;
                }

                if (bluX < 0) {
                    bluX = 0;
                }
                if (bluX >= width) {
                    bluX = width - 1;
                }
                if (bluY < 0) {
                    bluY = 0;
                }
                if (bluY >= height) {
                    bluY = height - 1;
                }

                var redPixel = ((redY * width) + redX) * 4;
                var grnPixel = ((grnY * width) + grnX) * 4;
                var bluPixel = ((bluY * width) + bluX) * 4;

                outPixels[pixel] = refPixels[redPixel];
                outPixels[pixel + 1] = refPixels[grnPixel + 1];
                outPixels[pixel + 2] = refPixels[bluPixel + 2];
                outPixels[pixel + 3] = this._alphaMax ?
                    Math.max(refPixels[redPixel + 3], refPixels[grnPixel + 3], refPixels[bluPixel + 3]) :
                    (refPixels[redPixel + 3] + refPixels[grnPixel + 3] + refPixels[bluPixel + 3]) / 3;
            }
        }

        return true;
    };

    createjs.AberrationFilter = createjs.promote(AberrationFilter, 'Filter');
}());
