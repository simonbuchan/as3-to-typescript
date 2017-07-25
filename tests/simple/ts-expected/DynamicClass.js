"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DynamicClass = (function () {
    function DynamicClass() {
        var myClass = new SubDynamicClass();
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
