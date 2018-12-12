this.createjs = this.createjs || {};

(function () {
    'use strict';


    function VideoBuffer (video) {


        this.readyState = video.readyState;


        this._video = video;


        this._canvas = null;


        this._lastTime = -1;

        if (this.readyState < 2) {
            video.addEventListener('canplaythrough', this._videoReady.bind(this));
        }
    }

    var p = VideoBuffer.prototype;


    p.getImage = function () {
        if (this.readyState < 2) {
            return;
        }
        var canvas = this._canvas, video = this._video;
        if (!canvas) {
            canvas = this._canvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        if (video.readyState >= 2 && video.currentTime !== this._lastTime) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            this._lastTime = video.currentTime;
        }
        return canvas;
    };


    p._videoReady = function () {
        this.readyState = 2;
    };


    createjs.VideoBuffer = VideoBuffer;
}());
