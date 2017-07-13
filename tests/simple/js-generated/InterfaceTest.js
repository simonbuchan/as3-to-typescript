"use strict";
var InterfaceTest = (function () {
    function InterfaceTest() {
        var myClass = new MyClass();
        console.log(myClass.myFunc(1));
    }
    return InterfaceTest;
}());
exports.InterfaceTest = InterfaceTest;
var MyClass = (function () {
    function MyClass() {
    }
    MyClass.prototype.myFunc = function (value) {
        return 10;
    };
    return MyClass;
}());
