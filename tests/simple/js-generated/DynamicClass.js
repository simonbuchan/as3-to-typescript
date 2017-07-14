"use strict";
var SubDynamicClass_1 = require("./SubDynamicClass");
var DynamicClass = (function () {
    function DynamicClass() {
        var myClass = new SubDynamicClass_1.SubDynamicClass();
        myClass.a = 10;
        console.log(myClass);
    }
    return DynamicClass;
}());
exports.DynamicClass = DynamicClass;
var SubDynamicClass = (function () {
    function SubDynamicClass() {
    }
    return SubDynamicClass;
}());
exports.SubDynamicClass = SubDynamicClass;
