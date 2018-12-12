this.createjs = this.createjs || {};

(function () {
    'use strict';


    function WebGLInspector (stage) {}

    var p = createjs.extend(WebGLInspector, createjs.EventDispatcher);


    WebGLInspector.alternateOutput = undefined;


    WebGLInspector.stage = undefined;


    WebGLInspector.log = function () {
        (WebGLInspector.alternateOutput ? WebGLInspector.alternateOutput.log : console.log).apply(this, arguments);
    };


    WebGLInspector.logAll = function (stage) {
        if (!stage) {
            stage = WebGLInspector.stage;
        }

        WebGLInspector.log('Average batches Per Draw', (stage._batchID / stage._drawID).toFixed(4));
        WebGLInspector.logContextInfo(stage._webGLContext);
        WebGLInspector.logDepth(stage.children, '');
        WebGLInspector.logTextureFill(stage);
    };


    WebGLInspector.replaceRenderBatchCall = function (stage, newFunc) {
        if (!stage) {
            stage = WebGLInspector.stage;
        }

        if (newFunc === undefined && stage._renderBatch_) {
            stage._renderBatch = stage._renderBatch_;
            stage._renderBatch_ = undefined;
        } else {
            if (stage._renderBatch_ === undefined) {
                stage._renderBatch_ = stage._renderBatch;
            }
            stage._renderBatch = newFunc;
        }
    };


    WebGLInspector.replaceRenderCoverCall = function (stage, newFunc) {
        if (!stage) {
            stage = WebGLInspector.stage;
        }

        if (newFunc === undefined && stage._renderCover_) {
            stage._renderCover = stage._renderCover_;
            stage._renderCover_ = undefined;
        } else {
            if (stage._renderCover_ === undefined) {
                stage._renderCover_ = stage._renderCover;
            }
            stage._renderCover = newFunc;
        }
    };


    WebGLInspector.logDepth = function (children, prepend, customLog) {
        if (!children) {
            children = WebGLInspector.stage.children;
        }
        if (!prepend) {
            prepend = '';
        }

        var l = children.length;
        for (var i = 0; i < l; i++) {
            var child = children[i];
            (customLog !== undefined ? customLog : WebGLInspector.log)(prepend + '-', child);
            if (child.children && child.children.length) {
                WebGLInspector.logDepth(child.children, '|' + prepend, customLog);
            }
        }
    };


    WebGLInspector.logContextInfo = function (gl) {
        if (!gl) {
            gl = WebGLInspector.stage._webGLContext;
        }
        var data = '== LOG:\n';
        data += 'Max textures per draw: ' + gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) + '\n';
        data += 'Max textures active: ' + gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) + '\n';
        data += '\n';
        data += 'Max texture size: ' + (gl.getParameter(gl.MAX_TEXTURE_SIZE) / 2) + '^2 \n';
        data += 'Max cache size: ' + (gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) / 2) + '^2 \n';
        data += '\n';
        data += 'Max attributes per vertex: ' + gl.getParameter(gl.MAX_VERTEX_ATTRIBS) + '\n';
        data += 'WebGL Version string: ' + gl.getParameter(gl.VERSION) + '\n';
        data += '======';
        WebGLInspector.log(data);
    };


    WebGLInspector.logTextureFill = function (stage) {
        if (!stage) {
            stage = WebGLInspector.stage;
        }

        var dict = stage._textureDictionary;
        var count = stage._batchTextureCount;
        WebGLInspector.log('textureMax:', count);
        var output = [];
        for (var n in dict) {
            var str = n.replace(window.location.origin, '');
            var tex = dict[n];
            var shifted = tex._lastActiveIndex ? tex._lastActiveIndex === tex._activeIndex : false;
            output.push({ src: str, element: tex, shifted: shifted });
            tex._lastActiveIndex = tex._activeIndex;
        }

        output.sort(function (a, b) {
            if (a.element._drawID === stage._drawID) {
                return 1;
            }
            if (a.element._drawID < b.element._drawID) {
                return -1;
            }
            return 0;
        });

        var l = output.length;
        for (var i = 0; i < l; i++) {
            var out = output[i];
            var active = out.element._drawID === stage._drawID;
            WebGLInspector.log('[' + out.src + '] ' + (active ? 'ACTIVE' : 'stale') + ' ' + (out.shifted ? 'steady' : 'DRIFT'), out.element);
        }
    };


    WebGLInspector.dispProps = function (prepend, item) {
        if (!prepend) {
            prepend = '';
        }

        var p = '\tP:' + item.x.toFixed(2) + 'x' + item.y.toFixed(2) + '\t';
        var r = '\tR:' + item.regX.toFixed(2) + 'x' + item.regY.toFixed(2) + '\t';

        WebGLInspector.log(prepend, item.toString() + '\t', p, r);
    };


    WebGLInspector.trackMaxBatchDraw = function () {
        var cardCount = this._batchVertexCount / createjs.StageGL.INDICIES_PER_CARD;
        if (!(cardCount < WebGLInspector.__lastHighest)) {
            WebGLInspector.__lastHighest = cardCount;
        }


        stage._renderBatch_();
    };


    WebGLInspector.drawEmptyBatch = function () {
        WebGLInspector.log('BlankBatch[' + this._drawID + ':' + this._batchID + '] : ' + this.batchReason);
        this._batchVertexCount = 0;
        this._batchID++;
    };


    WebGLInspector.drawEmptyCover = function () {
        WebGLInspector.log('BlankCover[' + this._drawID + ':' + this._batchID + '] : ' + this.batchReason);
        this._batchID++;
    };


    WebGLInspector.drawTexBuffer = function () {
        var gl = this._webGLContext;
        var texSize = 2048;


        var batchVertexCount = this._batchVertexCount;
        var projectionMatrix = this._projectionMatrix;
        var shader = this._activeShader;
        var vertices = this._vertices;
        var indices = this._indices;
        var uvs = this._uvs;
        var alphas = this._alphas;
        var reason = this.batchReason;


        if (this._inspectorFrame === undefined) {
            this._inspectorFrame = this.getRenderBufferTexture(texSize, texSize);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._inspectorFrame._frameBuffer);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }


        this._activeShader = this._mainShader;
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, texSize, texSize);

        this._projectionMatrix = new Float32Array([2 / texSize, 0, 0, 0, 0, -2 / texSize, 0, 0, 0, 0, 1, 0, -1, 1, 0, 1]);
        this._vertices = new Float32Array(this._batchTextureCount * 2 * createjs.StageGL.INDICIES_PER_CARD);
        this._indices = new Float32Array(this._batchTextureCount * 1 * createjs.StageGL.INDICIES_PER_CARD);
        this._uvs = new Float32Array(this._batchTextureCount * 2 * createjs.StageGL.INDICIES_PER_CARD);
        this._alphas = new Float32Array(this._batchTextureCount * 1 * createjs.StageGL.INDICIES_PER_CARD);
        this.batchReason = 'LoadedTextureDebug';

        var squareBase = Math.ceil(Math.sqrt(this._batchTextureCount));
        for (var i = 0; i < this._batchTextureCount; i++) {
            var i1 = i * 6, i2 = i1 * 2;
            var row = i % squareBase, col = Math.floor(i / squareBase), size = (1 / squareBase) * texSize;
            this._vertices[i2] = (row) * size;
            this._vertices[i2 + 1] = (col) * size;
            this._vertices[i2 + 2] = (row) * size;
            this._vertices[i2 + 3] = (col + 1) * size;
            this._vertices[i2 + 4] = (row + 1) * size;
            this._vertices[i2 + 5] = (col) * size;
            this._vertices[i2 + 6] = this._vertices[i2 + 2];
            this._vertices[i2 + 7] = this._vertices[i2 + 3];
            this._vertices[i2 + 8] = this._vertices[i2 + 4];
            this._vertices[i2 + 9] = this._vertices[i2 + 5];
            this._vertices[i2 + 10] = (row + 1) * size;
            this._vertices[i2 + 11] = (col + 1) * size;
            this._uvs[i2] = 0;
            this._uvs[i2 + 1] = 1;
            this._uvs[i2 + 2] = 0;
            this._uvs[i2 + 3] = 0;
            this._uvs[i2 + 4] = 1;
            this._uvs[i2 + 5] = 1;
            this._uvs[i2 + 6] = 0;
            this._uvs[i2 + 7] = 0;
            this._uvs[i2 + 8] = 1;
            this._uvs[i2 + 9] = 1;
            this._uvs[i2 + 10] = 1;
            this._uvs[i2 + 11] = 0;
            this._indices[i1] = this._indices[i1 + 1] = this._indices[i1 + 2] = this._indices[i1 + 3] = this._indices[i1 + 4] = this._indices[i1 + 5] = i;
            this._alphas[i1] = this._alphas[i1 + 1] = this._alphas[i1 + 2] = this._alphas[i1 + 3] = this._alphas[i1 + 4] = this._alphas[i1 + 5] = 1;
        }


        this._batchVertexCount = this._batchTextureCount * createjs.StageGL.INDICIES_PER_CARD;
        this._renderBatch_();
        this._batchID--;


        gl.bindFramebuffer(gl.FRAMEBUFFER, this._batchTextureOutput._frameBuffer);

        var shaderData = this._builtShaders[this._renderMode];
        gl.blendEquationSeparate(shaderData.eqRGB, shaderData.eqA);
        gl.blendFuncSeparate(shaderData.srcRGB, shaderData.dstRGB, shaderData.srcA, shaderData.dstA);
        gl.viewport(0, 0, this._viewportWidth, this._viewportHeight);

        this._activeShader = shader;
        this._batchVertexCount = batchVertexCount;
        this._projectionMatrix = projectionMatrix;
        this._vertices = vertices;
        this._indices = indices;
        this._uvs = uvs;
        this._alphas = alphas;
        this.batchReason = reason;

        this._renderBatch_();
    };

    createjs.WebGLInspector = createjs.promote(WebGLInspector, 'EventDispatcher');
}());
