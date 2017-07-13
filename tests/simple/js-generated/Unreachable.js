"use strict";
/**
 * Created by palebluedot on 5/3/17.
 */
var Unreachable = (function () {
    function Unreachable() {
        this.demonstrate();
    }
    Unreachable.prototype.demonstrate = function () {
        var tPow = 1;
        var tExp = 1;
        var tNum = 1;
        var tAverage = 1;
        var tFactorial = 1;
        var tRandom = 1;
        // more stuff in function here
        while (true) {
            var tP = tPow * tExp / tFactorial;
            if (tRandom < tP) {
                return tNum;
            }
            tRandom -= tP;
            tNum++;
            tFactorial *= tNum;
            tPow *= tAverage;
        }
        //        return 0 // just for the compiler
    };
    return Unreachable;
}());
exports.Unreachable = Unreachable;
