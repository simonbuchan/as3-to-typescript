"use strict";
var Callbacks = (function () {
    function Callbacks() {
        this.a = "a";
        this.callback(); // in ts: (class callback) this is: [object Object], a is: a
        this.executeCallback(this.callback); // in ts: (class callback) this is: undefined, a is: unknown
        this.executeCallback(function () {
            console.log("(anonymous callback) this is: " + this);
            if (this) {
                console.log("a is: " + this.a);
            }
            else {
                console.log("a is: unknown");
            }
        });
    }
    Callbacks.prototype.callback = function () {
        console.log("(class callback) this is: " + this);
        if (this) {
            console.log("a is: " + this.a);
        }
        else {
            console.log("a is: unknown");
        }
    };
    Callbacks.prototype.executeCallback = function (callback) {
        callback();
    };
    return Callbacks;
}());
exports.Callbacks = Callbacks;
new Callbacks();
