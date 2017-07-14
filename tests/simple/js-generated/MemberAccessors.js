"use strict";
var Accessors = (function () {
    function Accessors() {
        this.memberVar = "hello";
        this.memberMethod();
    }
    Accessors.prototype.memberMethod = function () {
        console.log(this.memberVar);
        var a = "a";
        var b = "b";
        var c = function () {
            console.log("hello! I am here to make your life more complicated =D");
        };
    };
    return Accessors;
}());
exports.Accessors = Accessors;
