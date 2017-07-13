"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MyClass_1 = require("./MyClass");
var SuperHoistingTest = (function (_super) {
    __extends(SuperHoistingTest, _super);
    function SuperHoistingTest() {
    }
    /*override*/ SuperHoistingTest.prototype.myFunc = function (value) {
        return _super.prototype.myFunc.call(this, value) * 3;
    };
    Object.defineProperty(SuperHoistingTest.prototype, "myProp", {
        /*override*/ get: function () { return _super.prototype.myProp * 5; },
        /*override*/ set: function (value) { _super.prototype.myProp / 5; },
        enumerable: true,
        configurable: true
    });
    return SuperHoistingTest;
}(MyClass_1.MyClass));
exports.SuperHoistingTest = SuperHoistingTest;
var MyClass = (function () {
    function MyClass() {
        this.myVar = 7;
        this._myProp = 5;
        this.myVar2 = 13;
    }
    Object.defineProperty(MyClass.prototype, "myProp", {
        get: function () { return this._myProp; },
        set: function (value) { this._myProp = value; },
        enumerable: true,
        configurable: true
    });
    MyClass.prototype.myFunc = function (value) {
        return value * 10;
    };
    return MyClass;
}());
