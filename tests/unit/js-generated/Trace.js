"use strict";
var Trace = (function () {
    function Trace() {
        console.log("hello!");
        console.log("tracing 1, 2, 3...");
        console.log("yup, seems to work");
    }
    return Trace;
}());
exports.Trace = Trace;
new Trace();
