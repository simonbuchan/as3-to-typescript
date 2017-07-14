"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SuperArray = (function (_super) {
    __extends(SuperArray, _super);
    function SuperArray() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        _super.call(this, args);
        var thisAny = this;
        thisAny.__proto__ = SuperArray.prototype;
        var a = 'this should all be normal stuff';
        console.log(a);
        /*
        Expects TS to insert the following when a class extends array:
        var thisAny:any=this;
         thisAny.__proto__ = SuperArray.prototype;
        * */
    }
    return SuperArray;
}(Array));
exports.SuperArray = SuperArray;
