"use strict";
var MappedClass_1 = require("./MappedClass");
var ForEachClassMapping = (function () {
    function ForEachClassMapping() {
        var myObj = {};
        var a = new MappedClass_1.MappedClass("a");
        myObj.a = a;
        var b = new MappedClass_1.MappedClass("b");
        myObj.b = b;
        var c = new MappedClass_1.MappedClass("c");
        myObj.c = c;
        for (var __$nflvKey in myObj) {
            var value = myObj[__$nflvKey];
            console.log(value);
        }
    }
    return ForEachClassMapping;
}());
exports.ForEachClassMapping = ForEachClassMapping;
var MappedClass = (function () {
    function MappedClass(value) {
        this.value = value;
    }
    MappedClass.prototype.toString = function () {
        return this.value;
    };
    return MappedClass;
}());
