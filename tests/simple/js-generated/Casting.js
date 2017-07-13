"use strict";
var Casting = (function () {
    function Casting() {
        var v0 = "HEY";
        this.thisMethodIsInTheClassScope(v0.toLowerCase());
        var v1 = [1, 2, 3];
        var v2 = String(v1[2]);
        var v3 = String(v1[2].toUpperCase());
        this.thisMethodIsInTheClassScope("hey");
        var nowThisIsTricky = Number(v1[3]);
        var v4 = Math.round(Number("5"));
        var v4 = Math.round(5.2);
        var v5 = <number />, _a =  > ([1, 2, 3, 4]);
        console.log("lets cast");
        var str = "5";
        var num = 1;
        console.log("str: " + str + ", num: " + num);
        // String -> Num
        num = Number(str) + 1;
        console.log("str: " + str + ", num: " + num);
        // Num -> String
        str = String(num + 1);
        console.log("str: " + str + ", num: " + num);
    }
    Casting.prototype.thisMethodIsInTheClassScope = function (str) {
        console.log(str);
    };
    return Casting;
}());
exports.Casting = Casting;
new Casting();
