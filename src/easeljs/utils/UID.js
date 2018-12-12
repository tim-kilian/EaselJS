this.createjs = this.createjs || {};

(function () {
    'use strict';


    function UID () {
        throw 'UID cannot be instantiated';
    }


    UID._nextID = 0;


    UID.get = function () {
        return UID._nextID++;
    };


    createjs.UID = UID;
}());
