"use strict";
var LogTests_1 = require("./LogTests");
var MySubClass_1 = require("./MySubClass");
var ScopeTest_1 = require("./ScopeTest");
var setTimeout_1 = require("../flash/utils/setTimeout");
var ScopeTest = (function () {
    function ScopeTest() {
        this.myVar1 = "classMember";
        this.myVar2 = "classMember";
        //LogTests.log("Constructor,this:",  String(this), "[object ScopeTest]");
        LogTests_1.LogTests.log("Constructor::this.myVar1:", this.myVar1, "classMember");
        LogTests_1.LogTests.log("Constructor::this.myVar2:", this.myVar2, "classMember");
        LogTests_1.LogTests.log("Constructor::myVar1:", this.myVar1, "classMember");
        LogTests_1.LogTests.log("Constructor::myVar2:", this.myVar2, "classMember");
        this.memberFunc();
        var mySubClass = new MySubClass_1.MySubClass(this);
    }
    ScopeTest.prototype.memberFunc = function () {
        var myVar1 = "memberFunc";
        //LogTests.log("memberFunc,this:",  String(this), "[object ScopeTest]");
        LogTests_1.LogTests.log("memberFunc::this.myVar1:", this.myVar1, "classMember");
        LogTests_1.LogTests.log("memberFunc::this.myVar2:", this.myVar2, "classMember");
        LogTests_1.LogTests.log("memberFunc::myVar1:", myVar1, "memberFunc");
        LogTests_1.LogTests.log("memberFunc::myVar2:", myVar2, "null");
        setTimeout_1.setTimeout(function () {
            var myVar1 = "anonymous";
            //LogTests.log("setTimeout,this:",  String(this), "[object global]");
            LogTests_1.LogTests.log("setTimeout::this.myVar1:", this.myVar1, "null");
            LogTests_1.LogTests.log("setTimeout::this.myVar2:", this.myVar2, "null");
            LogTests_1.LogTests.log("setTimeout::myVar1:", myVar1, "anonymous");
            LogTests_1.LogTests.log("setTimeout::myVar2:", myVar2, "memberFunc");
        }, 0);
        var myVar2 = "memberFunc";
        var funcVariable = function (whoCalls) {
            var myVar1 = "funcVariable";
            switch (whoCalls) {
                case "external :":
                    //LogTests.log ("funcVariable,this:" + whoCalls,  String(this), "[object ScopeTest]");
                    if (this) {
                        LogTests_1.LogTests.log("funcVariable::this.myVar1:" + whoCalls, this.myVar1, "classMember");
                        LogTests_1.LogTests.log("funcVariable::this.myVar2:" + whoCalls, this.myVar2, "classMember");
                    }
                    else {
                        LogTests_1.LogTests.log("funcVariable::this.myVar1:" + whoCalls, null, "classMember");
                        LogTests_1.LogTests.log("funcVariable::this.myVar2:" + whoCalls, null, "classMember");
                    }
                    break;
                case "inFunc: ":
                    //LogTests.log ("funcVariable,this:" + whoCalls,  String(this), "[object global]");
                    if (this) {
                        LogTests_1.LogTests.log("funcVariable::this.myVar1:" + whoCalls, this.myVar1, "null");
                        LogTests_1.LogTests.log("funcVariable::this.myVar2:" + whoCalls, this.myVar2, "null");
                    }
                    else {
                        LogTests_1.LogTests.log("funcVariable::this.myVar1:" + whoCalls, null, "null");
                        LogTests_1.LogTests.log("funcVariable::this.myVar2:" + whoCalls, null, "null");
                    }
                    break;
                case "setTimeout :":
                    //LogTests.log ("funcVariable,this:" + whoCalls,  String(this), "[object global]");
                    if (this) {
                        LogTests_1.LogTests.log("funcVariable::this.myVar1:" + whoCalls, this.myVar1, "null");
                        LogTests_1.LogTests.log("funcVariable::this.myVar2:" + whoCalls, this.myVar2, "null");
                    }
                    else {
                        LogTests_1.LogTests.log("funcVariable::this.myVar1:" + whoCalls, null, "null");
                        LogTests_1.LogTests.log("funcVariable::this.myVar2:" + whoCalls, null, "null");
                    }
                    break;
            }
            LogTests_1.LogTests.log("funcVariable::myVar1:", myVar1, "funcVariable");
            LogTests_1.LogTests.log("funcVariable::myVar2:", myVar2, "memberFunc");
        };
        funcVariable("inFunc: ");
        this.funcRef = funcVariable;
        this.funcRef2 = this.myPrivateFunc;
        setTimeout_1.setTimeout(funcVariable, 100, "setTimeout :");
        setTimeout_1.setTimeout(this.myPrivateFunc, 200, "fromSTO :");
        setTimeout_1.setTimeout(this.myPublicFunc, 200, "fromSTO :");
    };
    ScopeTest.prototype.myPrivateFunc = function (whoCalls) {
        if (whoCalls === void 0) { whoCalls = ""; }
        //LogTests.log("myPrivateFunc,this:" + whoCalls,  String(this), "[object ScopeTest]");
        LogTests_1.LogTests.log("myPrivateFunc::this.myVar1:" + whoCalls, this.myVar1, "classMember");
        LogTests_1.LogTests.log("myPrivateFunc::this.myVar2:" + whoCalls, this.myVar2, "classMember");
        LogTests_1.LogTests.log("myPrivateFunc::myVar1:" + whoCalls, this.myVar1, "classMember");
        LogTests_1.LogTests.log("myPrivateFunc::myVar2:" + whoCalls, this.myVar2, "classMember");
    };
    ScopeTest.prototype.myPublicFunc = function (whoCalls) {
        if (whoCalls === void 0) { whoCalls = ""; }
        //LogTests.log("myPrivateFunc,this:" + whoCalls,  String(this), "[object ScopeTest]");
        LogTests_1.LogTests.log("myPublicFunc::this.myVar1:" + whoCalls, this.myVar1, "classMember");
        LogTests_1.LogTests.log("myPublicFunc::this.myVar2:" + whoCalls, this.myVar2, "classMember");
        LogTests_1.LogTests.log("myPublicFunc::myVar1:" + whoCalls, this.myVar1, "classMember");
        LogTests_1.LogTests.log("myPublicFunc::myVar2:" + whoCalls, this.myVar2, "classMember");
    };
    return ScopeTest;
}());
exports.ScopeTest = ScopeTest;
var MySubClass = (function () {
    function MySubClass(main) {
        main.funcRef("external");
        main.funcRef2();
        setTimeout_1.setTimeout(main.funcRef2, 400, "externalSTO:");
    }
    return MySubClass;
}());
var LogTests = (function () {
    function LogTests() {
    }
    LogTests.log = function (id, out, expected) {
        LogTests_1.LogTests.counter++;
        var isPassed = String(out) == expected;
        if (String(out) == "undefined" && expected == "null")
            isPassed = true;
        if (String(out) == "null" && expected == "undefined")
            isPassed = true;
        console.log(LogTests_1.LogTests.counter + ":" + isPassed + ":\t\tid=" + id, "out=" + out, "expected=" + expected);
    };
    LogTests.counter = 0;
    return LogTests;
}());
var test = new ScopeTest_1.ScopeTest();
