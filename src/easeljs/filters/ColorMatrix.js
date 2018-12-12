this.createjs = this.createjs || {};

(function () {
    'use strict';


    function ColorMatrix (brightness, contrast, saturation, hue) {
        this.setColor(brightness, contrast, saturation, hue);
    }

    var p = ColorMatrix.prototype;


    ColorMatrix.DELTA_INDEX = [
        0, 0.01, 0.02, 0.04, 0.05, 0.06, 0.07, 0.08, 0.1, 0.11,
        0.12, 0.14, 0.15, 0.16, 0.17, 0.18, 0.20, 0.21, 0.22, 0.24,
        0.25, 0.27, 0.28, 0.30, 0.32, 0.34, 0.36, 0.38, 0.40, 0.42,
        0.44, 0.46, 0.48, 0.5, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68,
        0.71, 0.74, 0.77, 0.80, 0.83, 0.86, 0.89, 0.92, 0.95, 0.98,
        1.0, 1.06, 1.12, 1.18, 1.24, 1.30, 1.36, 1.42, 1.48, 1.54,
        1.60, 1.66, 1.72, 1.78, 1.84, 1.90, 1.96, 2.0, 2.12, 2.25,
        2.37, 2.50, 2.62, 2.75, 2.87, 3.0, 3.2, 3.4, 3.6, 3.8,
        4.0, 4.3, 4.7, 4.9, 5.0, 5.5, 6.0, 6.5, 6.8, 7.0,
        7.3, 7.5, 7.8, 8.0, 8.4, 8.7, 9.0, 9.4, 9.6, 9.8,
        10.0,
    ];


    ColorMatrix.IDENTITY_MATRIX = [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
        0, 0, 0, 0, 1,
    ];


    ColorMatrix.LENGTH = ColorMatrix.IDENTITY_MATRIX.length;


    ColorMatrix.createSepiaPreset = function () {
        return (new ColorMatrix()).copy([
            0.4977, 0.9828, 0.1322, 0.0000, 14,
            0.4977, 0.9828, 0.1322, 0.0000, -14,
            0.4977, 0.9828, 0.1322, 0.0000, -47,
            0.0000, 0.0000, 0.0000, 1.0000, 0,
            0, 0, 0, 0, 1,
        ]);
    };


    ColorMatrix.createInvertPreset = function () {
        return (new ColorMatrix()).copy([
            -1.0000, 0.0000, 0.0000, 0.0000, 255,
            0.0000, -1.0000, 0.0000, 0.0000, 255,
            0.0000, 0.0000, -1.0000, 0.0000, 255,
            0.0000, 0.0000, 0.0000, 1.0000, 0,
            0, 0, 0, 0, 1,
        ]);
    };


    ColorMatrix.createGreyscalePreset = function () {
        return (new ColorMatrix()).copy([
            0.3333, 0.3334, 0.3333, 0.0000, 0,
            0.3333, 0.3334, 0.3333, 0.0000, 0,
            0.3333, 0.3334, 0.3333, 0.0000, 0,
            0.0000, 0.0000, 0.0000, 1.0000, 0,
            0, 0, 0, 0, 1,
        ]);
    };


    p.setColor = function (brightness, contrast, saturation, hue) {
        return this.reset().adjustColor(brightness, contrast, saturation, hue);
    };


    p.reset = function () {
        return this.copy(ColorMatrix.IDENTITY_MATRIX);
    };


    p.adjustColor = function (brightness, contrast, saturation, hue) {
        this.adjustHue(hue);
        this.adjustContrast(contrast);
        this.adjustBrightness(brightness);
        return this.adjustSaturation(saturation);
    };


    p.adjustBrightness = function (value) {
        if (value == 0 || isNaN(value)) {
            return this;
        }
        value = this._cleanValue(value, 255);
        this._multiplyMatrix([
            1, 0, 0, 0, value,
            0, 1, 0, 0, value,
            0, 0, 1, 0, value,
            0, 0, 0, 1, 0,
            0, 0, 0, 0, 1,
        ]);
        return this;
    };


    p.adjustOffset = function (r, g, b) {
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return this;
        }
        this[4] = this._cleanValue(this[4] + r, 255);
        this[9] = this._cleanValue(this[9] + g, 255);
        this[14] = this._cleanValue(this[14] + b, 255);
        return this;
    };


    p.adjustContrast = function (value) {
        if (value == 0 || isNaN(value)) {
            return this;
        }
        value = this._cleanValue(value, 100);
        var x;
        if (value < 0) {
            x = 127 + value / 100 * 127;
        } else {
            x = value % 1;
            if (x == 0) {
                x = ColorMatrix.DELTA_INDEX[value];
            } else {
                x = ColorMatrix.DELTA_INDEX[(value << 0)] * (1 - x) + ColorMatrix.DELTA_INDEX[(value << 0) + 1] * x;
            }
            x = x * 127 + 127;
        }
        this._multiplyMatrix([
            x / 127, 0, 0, 0, 0.5 * (127 - x),
            0, x / 127, 0, 0, 0.5 * (127 - x),
            0, 0, x / 127, 0, 0.5 * (127 - x),
            0, 0, 0, 1, 0,
            0, 0, 0, 0, 1,
        ]);
        return this;
    };


    p.adjustSaturation = function (value) {
        if (value == 0 || isNaN(value)) {
            return this;
        }
        value = this._cleanValue(value, 100);
        var x = 1 + ((value > 0) ? 3 * value / 100 : value / 100);
        var lumR = 0.3086;
        var lumG = 0.6094;
        var lumB = 0.0820;
        this._multiplyMatrix([
            lumR * (1 - x) + x, lumG * (1 - x), lumB * (1 - x), 0, 0,
            lumR * (1 - x), lumG * (1 - x) + x, lumB * (1 - x), 0, 0,
            lumR * (1 - x), lumG * (1 - x), lumB * (1 - x) + x, 0, 0,
            0, 0, 0, 1, 0,
            0, 0, 0, 0, 1,
        ]);
        return this;
    };


    p.adjustHue = function (value) {
        if (value == 0 || isNaN(value)) {
            return this;
        }
        value = this._cleanValue(value, 180) / 180 * Math.PI;
        var cosVal = Math.cos(value);
        var sinVal = Math.sin(value);
        var lumR = 0.213;
        var lumG = 0.715;
        var lumB = 0.072;
        this._multiplyMatrix([
            lumR + cosVal * (1 - lumR) + sinVal * (-lumR), lumG + cosVal * (-lumG) + sinVal * (-lumG), lumB + cosVal * (-lumB) + sinVal * (1 - lumB), 0, 0,
            lumR + cosVal * (-lumR) + sinVal * (0.143), lumG + cosVal * (1 - lumG) + sinVal * (0.140), lumB + cosVal * (-lumB) + sinVal * (-0.283), 0, 0,
            lumR + cosVal * (-lumR) + sinVal * (-(1 - lumR)), lumG + cosVal * (-lumG) + sinVal * (lumG), lumB + cosVal * (1 - lumB) + sinVal * (lumB), 0, 0,
            0, 0, 0, 1, 0,
            0, 0, 0, 0, 1,
        ]);
        return this;
    };


    p.concat = function (matrix) {
        matrix = this._fixMatrix(matrix);
        if (matrix.length != ColorMatrix.LENGTH) {
            return this;
        }
        this._multiplyMatrix(matrix);
        return this;
    };


    p.clone = function () {
        return (new ColorMatrix()).copy(this);
    };


    p.toArray = function () {
        var arr = [];
        for (var i = 0, l = ColorMatrix.LENGTH; i < l; i++) {
            arr[i] = this[i];
        }
        return arr;
    };


    p.copy = function (matrix) {
        var l = ColorMatrix.LENGTH;
        for (var i = 0; i < l; i++) {
            this[i] = matrix[i];
        }
        return this;
    };


    p.toString = function () {
        var sz = '';
        sz += '    ' + this[0].toFixed(4) + ', ' + this[1].toFixed(4) + ', ' + this[2].toFixed(4) + ', ' + this[3].toFixed(4) + ', ' + (this[4] | 0) + ',\n';
        sz += '    ' + this[5].toFixed(4) + ', ' + this[6].toFixed(4) + ', ' + this[7].toFixed(4) + ', ' + this[8].toFixed(4) + ', ' + (this[9] | 0) + ',\n';
        sz += '    ' + this[10].toFixed(4) + ', ' + this[11].toFixed(4) + ', ' + this[12].toFixed(4) + ', ' + this[13].toFixed(4) + ', ' + (this[14] | 0) + ',\n';
        sz += '    ' + this[15].toFixed(4) + ', ' + this[16].toFixed(4) + ', ' + this[17].toFixed(4) + ', ' + this[18].toFixed(4) + ', ' + (this[19] | 0) + ',\n';
        sz += '    ' + (this[20] | 0) + ', ' + (this[21] | 0) + ', ' + (this[22] | 0) + ', ' + (this[23] | 0) + ', ' + (this[24] | 0) + '\n';
        return '[ColorMatrix] {\n' + sz + '}';
    };


    p._multiplyMatrix = function (matrix) {
        var i, j, k, col = [];

        for (i = 0; i < 5; i++) {
            for (j = 0; j < 5; j++) {
                col[j] = this[j + i * 5];
            }
            for (j = 0; j < 5; j++) {
                var val = 0;
                for (k = 0; k < 5; k++) {
                    val += matrix[j + k * 5] * col[k];
                }
                this[j + i * 5] = val;
            }
        }
    };


    p._cleanValue = function (value, limit) {
        return Math.min(limit, Math.max(-limit, value));
    };


    p._fixMatrix = function (matrix) {
        if (matrix instanceof ColorMatrix) {
            matrix = matrix.toArray();
        }
        if (matrix.length < ColorMatrix.LENGTH) {
            matrix = matrix.slice(0, matrix.length).concat(ColorMatrix.IDENTITY_MATRIX.slice(matrix.length, ColorMatrix.LENGTH));
        } else if (matrix.length > ColorMatrix.LENGTH) {
            matrix = matrix.slice(0, ColorMatrix.LENGTH);
        }
        return matrix;
    };

    createjs.ColorMatrix = ColorMatrix;
}());
