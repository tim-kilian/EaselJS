this.createjs = this.createjs || {};


createjs.indexOf = function (array, searchElement) {
    'use strict';

    for (var i = 0, l = array.length; i < l; i++) {
        if (searchElement === array[i]) {
            return i;
        }
    }
    return -1;
};
