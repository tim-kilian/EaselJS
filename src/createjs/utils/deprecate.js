this.createjs = this.createjs || {};


createjs.deprecate = function (fallbackMethod, name) {
    'use strict';
    return function () {
        var msg = 'Deprecated property or method \'' + name + '\'. See docs for info.';
        console && (console.warn ? console.warn(msg) : console.log(msg));
        return fallbackMethod && fallbackMethod.apply(this, arguments);
    };
};