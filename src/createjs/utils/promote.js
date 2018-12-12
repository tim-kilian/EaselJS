this.createjs = this.createjs || {};


createjs.promote = function (subclass, prefix) {
    'use strict';

    var subP = subclass.prototype, supP = (Object.getPrototypeOf && Object.getPrototypeOf(subP)) || subP.__proto__;
    if (supP) {
        subP[(prefix += '_') + 'constructor'] = supP.constructor;
        for (var n in supP) {
            if (subP.hasOwnProperty(n) && (typeof supP[n] == 'function')) {
                subP[prefix + n] = supP[n];
            }
        }
    }
    return subclass;
};
