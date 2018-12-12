this.createjs = this.createjs || {};

(function () {
    'use strict';

    function Graphics () {

        this.command = null;

        this._stroke = null;

        this._strokeStyle = null;

        this._oldStrokeStyle = null;

        this._strokeDash = null;

        this._oldStrokeDash = null;

        this._strokeIgnoreScale = false;

        this._fill = null;

        this._instructions = [];

        this._commitIndex = 0;

        this._activeInstructions = [];

        this._dirty = false;

        this._storeIndex = 0;


        this.clear();
    }

    var p = Graphics.prototype;
    var G = Graphics;

    Graphics.getRGB = function (r, g, b, alpha) {
        if (r != null && b == null) {
            alpha = g;
            b = r & 0xFF;
            g = r >> 8 & 0xFF;
            r = r >> 16 & 0xFF;
        }
        if (alpha == null) {
            return 'rgb(' + r + ',' + g + ',' + b + ')';
        } else {
            return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        }
    };

    Graphics.getHSL = function (hue, saturation, lightness, alpha) {
        if (alpha == null) {
            return 'hsl(' + (hue % 360) + ',' + saturation + '%,' + lightness + '%)';
        } else {
            return 'hsla(' + (hue % 360) + ',' + saturation + '%,' + lightness + '%,' + alpha + ')';
        }
    };

    Graphics.BASE_64 = {
        'A': 0,
        'B': 1,
        'C': 2,
        'D': 3,
        'E': 4,
        'F': 5,
        'G': 6,
        'H': 7,
        'I': 8,
        'J': 9,
        'K': 10,
        'L': 11,
        'M': 12,
        'N': 13,
        'O': 14,
        'P': 15,
        'Q': 16,
        'R': 17,
        'S': 18,
        'T': 19,
        'U': 20,
        'V': 21,
        'W': 22,
        'X': 23,
        'Y': 24,
        'Z': 25,
        'a': 26,
        'b': 27,
        'c': 28,
        'd': 29,
        'e': 30,
        'f': 31,
        'g': 32,
        'h': 33,
        'i': 34,
        'j': 35,
        'k': 36,
        'l': 37,
        'm': 38,
        'n': 39,
        'o': 40,
        'p': 41,
        'q': 42,
        'r': 43,
        's': 44,
        't': 45,
        'u': 46,
        'v': 47,
        'w': 48,
        'x': 49,
        'y': 50,
        'z': 51,
        '0': 52,
        '1': 53,
        '2': 54,
        '3': 55,
        '4': 56,
        '5': 57,
        '6': 58,
        '7': 59,
        '8': 60,
        '9': 61,
        '+': 62,
        '/': 63,
    };

    Graphics.STROKE_CAPS_MAP = ['butt', 'round', 'square'];

    Graphics.STROKE_JOINTS_MAP = ['miter', 'round', 'bevel'];

    var canvas = (createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas'));
    if (canvas.getContext) {
        Graphics._ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 1;
    }


    p._getInstructions = function () {
        this._updateInstructions();
        return this._instructions;
    };

    p.getInstructions = createjs.deprecate(p._getInstructions, 'Graphics.getInstructions');

    try {
        Object.defineProperties(p, {
            instructions: { get: p._getInstructions },
        });
    } catch (e) {
    }


    p.isEmpty = function () {
        return !(this._instructions.length || this._activeInstructions.length);
    };

    p.draw = function (ctx, data) {
        this._updateInstructions();
        var instr = this._instructions;
        for (var i = this._storeIndex, l = instr.length; i < l; i++) {
            instr[i].exec(ctx, data);
        }
    };

    p.drawAsPath = function (ctx) {
        this._updateInstructions();
        var instr, instrs = this._instructions;
        for (var i = this._storeIndex, l = instrs.length; i < l; i++) {

            if ((instr = instrs[i]).path !== false) {
                instr.exec(ctx);
            }
        }
    };


    p.moveTo = function (x, y) {
        return this.append(new G.MoveTo(x, y), true);
    };

    p.lineTo = function (x, y) {
        return this.append(new G.LineTo(x, y));
    };

    p.arcTo = function (x1, y1, x2, y2, radius) {
        return this.append(new G.ArcTo(x1, y1, x2, y2, radius));
    };

    p.arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
        return this.append(new G.Arc(x, y, radius, startAngle, endAngle, anticlockwise));
    };

    p.quadraticCurveTo = function (cpx, cpy, x, y) {
        return this.append(new G.QuadraticCurveTo(cpx, cpy, x, y));
    };

    p.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
        return this.append(new G.BezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y));
    };

    p.rect = function (x, y, w, h) {
        return this.append(new G.Rect(x, y, w, h));
    };

    p.closePath = function () {
        return this._activeInstructions.length ? this.append(new G.ClosePath()) : this;
    };


    p.clear = function () {
        this._instructions.length = this._activeInstructions.length = this._commitIndex = 0;
        this._strokeStyle = this._oldStrokeStyle = this._stroke = this._fill = this._strokeDash = this._oldStrokeDash = null;
        this._dirty = this._strokeIgnoreScale = false;
        return this;
    };

    p.beginFill = function (color) {
        return this._setFill(color ? new G.Fill(color) : null);
    };


    p.beginLinearGradientFill = function (colors, ratios, x0, y0, x1, y1) {
        return this._setFill(new G.Fill().linearGradient(colors, ratios, x0, y0, x1, y1));
    };


    p.beginRadialGradientFill = function (colors, ratios, x0, y0, r0, x1, y1, r1) {
        return this._setFill(new G.Fill().radialGradient(colors, ratios, x0, y0, r0, x1, y1, r1));
    };


    p.beginBitmapFill = function (image, repetition, matrix) {
        return this._setFill(new G.Fill(null, matrix).bitmap(image, repetition));
    };


    p.endFill = function () {
        return this.beginFill();
    };


    p.setStrokeStyle = function (thickness, caps, joints, miterLimit, ignoreScale) {
        this._updateInstructions(true);
        this._strokeStyle = this.command = new G.StrokeStyle(thickness, caps, joints, miterLimit, ignoreScale);


        if (this._stroke) {
            this._stroke.ignoreScale = ignoreScale;
        }
        this._strokeIgnoreScale = ignoreScale;
        return this;
    };


    p.setStrokeDash = function (segments, offset) {
        this._updateInstructions(true);
        this._strokeDash = this.command = new G.StrokeDash(segments, offset);
        return this;
    };


    p.beginStroke = function (color) {
        return this._setStroke(color ? new G.Stroke(color) : null);
    };


    p.beginLinearGradientStroke = function (colors, ratios, x0, y0, x1, y1) {
        return this._setStroke(new G.Stroke().linearGradient(colors, ratios, x0, y0, x1, y1));
    };


    p.beginRadialGradientStroke = function (colors, ratios, x0, y0, r0, x1, y1, r1) {
        return this._setStroke(new G.Stroke().radialGradient(colors, ratios, x0, y0, r0, x1, y1, r1));
    };


    p.beginBitmapStroke = function (image, repetition) {

        return this._setStroke(new G.Stroke().bitmap(image, repetition));
    };


    p.endStroke = function () {
        return this.beginStroke();
    };


    p.curveTo = p.quadraticCurveTo;


    p.drawRect = p.rect;


    p.drawRoundRect = function (x, y, w, h, radius) {
        return this.drawRoundRectComplex(x, y, w, h, radius, radius, radius, radius);
    };


    p.drawRoundRectComplex = function (x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL) {
        return this.append(new G.RoundRect(x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL));
    };


    p.drawCircle = function (x, y, radius) {
        return this.append(new G.Circle(x, y, radius));
    };


    p.drawEllipse = function (x, y, w, h) {
        return this.append(new G.Ellipse(x, y, w, h));
    };


    p.drawPolyStar = function (x, y, radius, sides, pointSize, angle) {
        return this.append(new G.PolyStar(x, y, radius, sides, pointSize, angle));
    };


    p.append = function (command, clean) {
        this._activeInstructions.push(command);
        this.command = command;
        if (!clean) {
            this._dirty = true;
        }
        return this;
    };


    p.decodePath = function (str) {
        var instructions = [this.moveTo, this.lineTo, this.quadraticCurveTo, this.bezierCurveTo, this.closePath];
        var paramCount = [2, 2, 4, 6, 0];
        var i = 0, l = str.length;
        var params = [];
        var x = 0, y = 0;
        var base64 = Graphics.BASE_64;

        while (i < l) {
            var c = str.charAt(i);
            var n = base64[c];
            var fi = n >> 3;
            var f = instructions[fi];

            if (!f || (n & 3)) {
                throw('bad path data (@' + i + '): ' + c);
            }
            var pl = paramCount[fi];
            if (!fi) {
                x = y = 0;
            }
            params.length = 0;
            i++;
            var charCount = (n >> 2 & 1) + 2;
            for (var p = 0; p < pl; p++) {
                var num = base64[str.charAt(i)];
                var sign = (num >> 5) ? -1 : 1;
                num = ((num & 31) << 6) | (base64[str.charAt(i + 1)]);
                if (charCount == 3) {
                    num = (num << 6) | (base64[str.charAt(i + 2)]);
                }
                num = sign * num / 10;
                if (p % 2) {
                    x = (num += x);
                }
                else {
                    y = (num += y);
                }
                params[p] = num;
                i += charCount;
            }
            f.apply(this, params);
        }
        return this;
    };


    p.store = function () {
        this._updateInstructions(true);
        this._storeIndex = this._instructions.length;
        return this;
    };


    p.unstore = function () {
        this._storeIndex = 0;
        return this;
    };


    p.clone = function () {
        var o = new Graphics();
        o.command = this.command;
        o._stroke = this._stroke;
        o._strokeStyle = this._strokeStyle;
        o._strokeDash = this._strokeDash;
        o._strokeIgnoreScale = this._strokeIgnoreScale;
        o._fill = this._fill;
        o._instructions = this._instructions.slice();
        o._commitIndex = this._commitIndex;
        o._activeInstructions = this._activeInstructions.slice();
        o._dirty = this._dirty;
        o._storeIndex = this._storeIndex;
        return o;
    };


    p.toString = function () {
        return '[Graphics]';
    };


    p.mt = p.moveTo;


    p.lt = p.lineTo;


    p.at = p.arcTo;


    p.bt = p.bezierCurveTo;


    p.qt = p.quadraticCurveTo;


    p.a = p.arc;


    p.r = p.rect;


    p.cp = p.closePath;


    p.c = p.clear;


    p.f = p.beginFill;


    p.lf = p.beginLinearGradientFill;


    p.rf = p.beginRadialGradientFill;


    p.bf = p.beginBitmapFill;


    p.ef = p.endFill;


    p.ss = p.setStrokeStyle;


    p.sd = p.setStrokeDash;


    p.s = p.beginStroke;


    p.ls = p.beginLinearGradientStroke;


    p.rs = p.beginRadialGradientStroke;


    p.bs = p.beginBitmapStroke;


    p.es = p.endStroke;


    p.dr = p.drawRect;


    p.rr = p.drawRoundRect;


    p.rc = p.drawRoundRectComplex;


    p.dc = p.drawCircle;


    p.de = p.drawEllipse;


    p.dp = p.drawPolyStar;


    p.p = p.decodePath;


    p._updateInstructions = function (commit) {
        var instr = this._instructions, active = this._activeInstructions, commitIndex = this._commitIndex;

        if (this._dirty && active.length) {
            instr.length = commitIndex;
            instr.push(Graphics.beginCmd);

            var l = active.length, ll = instr.length;
            instr.length = ll + l;
            for (var i = 0; i < l; i++) {
                instr[i + ll] = active[i];
            }

            if (this._fill) {
                instr.push(this._fill);
            }
            if (this._stroke) {

                if (this._strokeDash !== this._oldStrokeDash) {
                    instr.push(this._strokeDash);
                }
                if (this._strokeStyle !== this._oldStrokeStyle) {
                    instr.push(this._strokeStyle);
                }
                if (commit) {
                    this._oldStrokeStyle = this._strokeStyle;
                    this._oldStrokeDash = this._strokeDash;
                }
                instr.push(this._stroke);
            }

            this._dirty = false;
        }

        if (commit) {
            active.length = 0;
            this._commitIndex = instr.length;
        }
    };


    p._setFill = function (fill) {
        this._updateInstructions(true);
        this.command = this._fill = fill;
        return this;
    };


    p._setStroke = function (stroke) {
        this._updateInstructions(true);
        if (this.command = this._stroke = stroke) {
            stroke.ignoreScale = this._strokeIgnoreScale;
        }
        return this;
    };


    (G.LineTo = function (x, y) {
        this.x = x;
        this.y = y;
    }).prototype.exec = function (ctx) { ctx.lineTo(this.x, this.y); };


    (G.MoveTo = function (x, y) {
        this.x = x;
        this.y = y;
    }).prototype.exec = function (ctx) { ctx.moveTo(this.x, this.y); };


    (G.ArcTo = function (x1, y1, x2, y2, radius) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.radius = radius;
    }).prototype.exec = function (ctx) { ctx.arcTo(this.x1, this.y1, this.x2, this.y2, this.radius); };


    (G.Arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.anticlockwise = !!anticlockwise;
    }).prototype.exec = function (ctx) { ctx.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle, this.anticlockwise); };


    (G.QuadraticCurveTo = function (cpx, cpy, x, y) {
        this.cpx = cpx;
        this.cpy = cpy;
        this.x = x;
        this.y = y;
    }).prototype.exec = function (ctx) { ctx.quadraticCurveTo(this.cpx, this.cpy, this.x, this.y); };


    (G.BezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
        this.cp1x = cp1x;
        this.cp1y = cp1y;
        this.cp2x = cp2x;
        this.cp2y = cp2y;
        this.x = x;
        this.y = y;
    }).prototype.exec = function (ctx) { ctx.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.x, this.y); };


    (G.Rect = function (x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }).prototype.exec = function (ctx) { ctx.rect(this.x, this.y, this.w, this.h); };


    (G.ClosePath = function () {
    }).prototype.exec = function (ctx) { ctx.closePath(); };


    (G.BeginPath = function () {
    }).prototype.exec = function (ctx) { ctx.beginPath(); };


    p = (G.Fill = function (style, matrix) {
        this.style = style;
        this.matrix = matrix;
    }).prototype;
    p.exec = function (ctx) {
        if (!this.style) {
            return;
        }
        ctx.fillStyle = this.style;
        var mtx = this.matrix;
        if (mtx) {
            ctx.save();
            ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
        }
        ctx.fill();
        if (mtx) {
            ctx.restore();
        }
    };

    p.linearGradient = function (colors, ratios, x0, y0, x1, y1) {
        var o = this.style = Graphics._ctx.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0, l = colors.length; i < l; i++) {
            o.addColorStop(ratios[i], colors[i]);
        }
        o.props = { colors: colors, ratios: ratios, x0: x0, y0: y0, x1: x1, y1: y1, type: 'linear' };
        return this;
    };

    p.radialGradient = function (colors, ratios, x0, y0, r0, x1, y1, r1) {
        var o = this.style = Graphics._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, l = colors.length; i < l; i++) {
            o.addColorStop(ratios[i], colors[i]);
        }
        o.props = { colors: colors, ratios: ratios, x0: x0, y0: y0, r0: r0, x1: x1, y1: y1, r1: r1, type: 'radial' };
        return this;
    };

    p.bitmap = function (image, repetition) {
        if (image.naturalWidth || image.getContext || image.readyState >= 2) {
            var o = this.style = Graphics._ctx.createPattern(image, repetition || '');
            o.props = { image: image, repetition: repetition, type: 'bitmap' };
        }
        return this;
    };
    p.path = false;


    p = (G.Stroke = function (style, ignoreScale) {
        this.style = style;
        this.ignoreScale = ignoreScale;
    }).prototype;
    p.exec = function (ctx) {
        if (!this.style) {
            return;
        }
        ctx.strokeStyle = this.style;
        if (this.ignoreScale) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctx.stroke();
        if (this.ignoreScale) {
            ctx.restore();
        }
    };

    p.linearGradient = G.Fill.prototype.linearGradient;

    p.radialGradient = G.Fill.prototype.radialGradient;

    p.bitmap = G.Fill.prototype.bitmap;
    p.path = false;


    p = (G.StrokeStyle = function (width, caps, joints, miterLimit, ignoreScale) {
        this.width = width;
        this.caps = caps;
        this.joints = joints;
        this.miterLimit = miterLimit;
        this.ignoreScale = ignoreScale;
    }).prototype;
    p.exec = function (ctx) {
        ctx.lineWidth = (this.width == null ? '1' : this.width);
        ctx.lineCap = (this.caps == null ? 'butt' : (isNaN(this.caps) ? this.caps : Graphics.STROKE_CAPS_MAP[this.caps]));
        ctx.lineJoin = (this.joints == null ? 'miter' : (isNaN(this.joints) ? this.joints : Graphics.STROKE_JOINTS_MAP[this.joints]));
        ctx.miterLimit = (this.miterLimit == null ? '10' : this.miterLimit);
        ctx.ignoreScale = (this.ignoreScale == null ? false : this.ignoreScale);
    };
    p.path = false;


    (G.StrokeDash = function (segments, offset) {
        this.segments = segments;
        this.offset = offset || 0;
    }).prototype.exec = function (ctx) {
        if (ctx.setLineDash) {
            ctx.setLineDash(this.segments || G.StrokeDash.EMPTY_SEGMENTS);
            ctx.lineDashOffset = this.offset || 0;
        }
    };

    G.StrokeDash.EMPTY_SEGMENTS = [];


    (G.RoundRect = function (x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.radiusTL = radiusTL;
        this.radiusTR = radiusTR;
        this.radiusBR = radiusBR;
        this.radiusBL = radiusBL;
    }).prototype.exec = function (ctx) {
        var max = (this.w < this.h ? this.w : this.h) / 2;
        var mTL = 0, mTR = 0, mBR = 0, mBL = 0;
        var x = this.x, y = this.y, w = this.w, h = this.h;
        var rTL = this.radiusTL, rTR = this.radiusTR, rBR = this.radiusBR, rBL = this.radiusBL;

        if (rTL < 0) {
            rTL *= (mTL = -1);
        }
        if (rTL > max) {
            rTL = max;
        }
        if (rTR < 0) {
            rTR *= (mTR = -1);
        }
        if (rTR > max) {
            rTR = max;
        }
        if (rBR < 0) {
            rBR *= (mBR = -1);
        }
        if (rBR > max) {
            rBR = max;
        }
        if (rBL < 0) {
            rBL *= (mBL = -1);
        }
        if (rBL > max) {
            rBL = max;
        }

        ctx.moveTo(x + w - rTR, y);
        ctx.arcTo(x + w + rTR * mTR, y - rTR * mTR, x + w, y + rTR, rTR);
        ctx.lineTo(x + w, y + h - rBR);
        ctx.arcTo(x + w + rBR * mBR, y + h + rBR * mBR, x + w - rBR, y + h, rBR);
        ctx.lineTo(x + rBL, y + h);
        ctx.arcTo(x - rBL * mBL, y + h + rBL * mBL, x, y + h - rBL, rBL);
        ctx.lineTo(x, y + rTL);
        ctx.arcTo(x - rTL * mTL, y - rTL * mTL, x + rTL, y, rTL);
        ctx.closePath();
    };


    (G.Circle = function (x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }).prototype.exec = function (ctx) { ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); };


    (G.Ellipse = function (x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }).prototype.exec = function (ctx) {
        var x = this.x, y = this.y;
        var w = this.w, h = this.h;

        var k = 0.5522848;
        var ox = (w / 2) * k;
        var oy = (h / 2) * k;
        var xe = x + w;
        var ye = y + h;
        var xm = x + w / 2;
        var ym = y + h / 2;

        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    };


    (G.PolyStar = function (x, y, radius, sides, pointSize, angle) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.sides = sides;
        this.pointSize = pointSize;
        this.angle = angle;
    }).prototype.exec = function (ctx) {
        var x = this.x, y = this.y;
        var radius = this.radius;
        var angle = (this.angle || 0) / 180 * Math.PI;
        var sides = this.sides;
        var ps = 1 - (this.pointSize || 0);
        var a = Math.PI / sides;

        ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        for (var i = 0; i < sides; i++) {
            angle += a;
            if (ps != 1) {
                ctx.lineTo(x + Math.cos(angle) * radius * ps, y + Math.sin(angle) * radius * ps);
            }
            angle += a;
            ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        }
        ctx.closePath();
    };


    Graphics.beginCmd = new G.BeginPath();


    createjs.Graphics = Graphics;
}());
