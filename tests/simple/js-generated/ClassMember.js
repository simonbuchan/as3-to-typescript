"use strict";
var ClassMember = (function () {
    function ClassMember() {
        this.myVar = 100;
        var myVar = 10;
        console.log(myVar);
    }
    return ClassMember;
}());
exports.ClassMember = ClassMember;
