"use strict";
var SubClass_1 = require("./SubClass");
var LoopImport = (function () {
    function LoopImport() {
        var array = [1, 2, 3, 4];
        for (var i = 0; i < array.length; i++) {
            console.log(array[i]);
            var subClass = new SubClass_1.SubClass();
        }
    }
    return LoopImport;
}());
exports.LoopImport = LoopImport;
var SubClass = (function () {
    function SubClass() {
    }
    return SubClass;
}());
