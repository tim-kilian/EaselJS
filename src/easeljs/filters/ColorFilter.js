this.createjs = this.createjs || {};

(function () {
    'use strict';


    function ColorFilter (redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset) {
        this.Filter_constructor();


        this.redMultiplier = redMultiplier != null ? redMultiplier : 1;


        this.greenMultiplier = greenMultiplier != null ? greenMultiplier : 1;


        this.blueMultiplier = blueMultiplier != null ? blueMultiplier : 1;


        this.alphaMultiplier = alphaMultiplier != null ? alphaMultiplier : 1;


        this.redOffset = redOffset || 0;


        this.greenOffset = greenOffset || 0;


        this.blueOffset = blueOffset || 0;


        this.alphaOffset = alphaOffset || 0;

        this.FRAG_SHADER_BODY = (
            'uniform vec4 uColorMultiplier;' +
            'uniform vec4 uColorOffset;' +

            'void main(void) {' +
            'vec4 color = texture2D(uSampler, vTextureCoord);' +
            'color = clamp(vec4(0.0), vec4(1.0), vec4(vec3(color.rgb / color.a), color.a));' +
            'color = clamp(vec4(0.0), vec4(1.0), color * uColorMultiplier + uColorOffset);' +

            'gl_FragColor = vec4(color.rgb * color.a, color.a);' +
            '}'
        );

    }

    var p = createjs.extend(ColorFilter, createjs.Filter);


    p.shaderParamSetup = function (gl, stage, shaderProgram) {
        gl.uniform4f(
            gl.getUniformLocation(shaderProgram, 'uColorMultiplier'),
            this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier
        );

        gl.uniform4f(
            gl.getUniformLocation(shaderProgram, 'uColorOffset'),
            this.redOffset / 255, this.greenOffset / 255, this.blueOffset / 255, this.alphaOffset / 255
        );
    };


    p.toString = function () {
        return '[ColorFilter]';
    };


    p.clone = function () {
        return new ColorFilter(
            this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier,
            this.redOffset, this.greenOffset, this.blueOffset, this.alphaOffset
        );
    };


    p._applyFilter = function (imageData) {
        var data = imageData.data;
        var l = data.length;
        for (var i = 0; i < l; i += 4) {
            data[i] = data[i] * this.redMultiplier + this.redOffset;
            data[i + 1] = data[i + 1] * this.greenMultiplier + this.greenOffset;
            data[i + 2] = data[i + 2] * this.blueMultiplier + this.blueOffset;
            data[i + 3] = data[i + 3] * this.alphaMultiplier + this.alphaOffset;
        }
        return true;
    };


    createjs.ColorFilter = createjs.promote(ColorFilter, 'Filter');
}());
