"use strict";
var TestVO_1 = require("./TestVO");
var LoopTests = (function () {
    //----------------------------------------------------------------------
    //	private fields
    //----------------------------------------------------------------------
    //----------------------------------------------------------------------
    //
    //	constructor
    //
    //----------------------------------------------------------------------
    function LoopTests() {
        //----------------------------------------------------------------------
        //	public fields
        //----------------------------------------------------------------------
        this.tests = new Array([]);
        this.test1ForeachComplex();
        this.test1ForeachComplex_Order();
        this.test2ForeachVector();
        this.test2ForeachVector_Order();
        this.test3ForeachArray();
        this.test3ForeachArray_Order();
        this.test4ForeachObject();
        this.test4ForeachObject_Order();
        this.test5ForClassic();
        this.test5ForClassic_Order();
        this.test6ForCComplexCondition();
        this.test6ForCComplexCondition_Order();
        this.test7WhileClassic();
        this.test7WhileClassic_Order();
        this.test8WhileSpecChars_Order();
        this.test9NestedWileDo_Order();
        this.testOffArrayForInDiscontinuous();
        this.testOffObjectForIn_Order();
        for (var i = 0; i < this.tests.length; i++) {
            var testVO = this.tests[i];
            console.log(testVO.caption + "\t\t", testVO.isValid + "\t\t", " expected:" + testVO.expected, " result:" + testVO.result, testVO.ref);
        }
    }
    LoopTests.prototype.test1ForeachComplex = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/Preloader.as#L96-L101";
        var Managers = {};
        Managers.pUser = {};
        Managers.pUser.pLanguages = {};
        Managers.pUser.pLanguages.a = 1;
        Managers.pUser.pLanguages.b = 2;
        Managers.pUser.pLanguages.c = 3;
        Managers.pUser.pLanguages.d = 4;
        var sum = 0;
        for (var __$nflvKey in Managers.pUser.pLanguages) {
            var tLang = undefined[__$nflvKey];
            sum += parseInt(tLang);
        }
        var testVO = new TestVO_1.TestVO(this.test1ForeachComplex, "test1ForeachNoOrderComplex", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test1ForeachComplex_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/Preloader.as#L96-L101";
        var Managers = {};
        Managers.pUser = {};
        Managers.pUser.pLanguages = {};
        Managers.pUser.pLanguages.a = "1";
        Managers.pUser.pLanguages.b = "2";
        Managers.pUser.pLanguages.c = "3";
        Managers.pUser.pLanguages.d = "4";
        var sum = "";
        for (var __$nflvKey in Managers.pUser.pLanguages) {
            var tLang = undefined[__$nflvKey];
            sum += tLang;
        }
        var testVO = new TestVO_1.TestVO(this.test1ForeachComplex_Order, "test1ForeachComplex_Order", ref, "3142", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test2ForeachVector = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L172";
        var pSelectedResource = [new Array([1, 2, 3, 4])];
        var tVector = pSelectedResource[0];
        var sum = 0;
        for (var __$nflvKey in tVector) {
            var tL = tVector[__$nflvKey];
            sum += tL;
        }
        var testVO = new TestVO_1.TestVO(this.test2ForeachVector, "test2ForeachVector", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test2ForeachVector_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L172";
        var pSelectedResource = [new Array(["1", "2", "3", "4"])];
        var tVector = pSelectedResource[0];
        var sum = "";
        for (var __$nflvKey in tVector) {
            var tL = tVector[__$nflvKey];
            sum += tL;
        }
        var testVO = new TestVO_1.TestVO(this.test2ForeachVector_Order, "test2ForeachVector_Order", ref, "1234", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test3ForeachArray = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
        var pCurrentSelection = [1, 2, 3, 4];
        var tPath = [];
        var i;
        var sum = 0;
        for (var __$nflvKey in pCurrentSelection) {
            i = pCurrentSelection[__$nflvKey];
            tPath.push(i);
            sum += i;
        }
        var testVO = new TestVO_1.TestVO(this.test3ForeachArray, "test3ForeachArray", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test3ForeachArray_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
        var pCurrentSelection = ["1", "2", "3", "4"];
        var tPath = [];
        var i;
        var sum = "";
        for (var __$nflvKey in pCurrentSelection) {
            i = pCurrentSelection[__$nflvKey];
            tPath.push(i);
            sum += String(i);
        }
        var testVO = new TestVO_1.TestVO(this.test3ForeachArray_Order, "test3ForeachArray_Order", ref, "1234", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test4ForeachObject = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L609-L611";
        var pButtonWidths = {};
        pButtonWidths.a = 1;
        pButtonWidths.b = 2;
        pButtonWidths.c = 3;
        pButtonWidths.d = 4;
        var sum = 0;
        for (var __$nflvKey in pButtonWidths) {
            var tW = pButtonWidths[__$nflvKey];
            sum += pButtonWidths[tW];
        }
        var testVO = new TestVO_1.TestVO(this.test4ForeachObject, "test4ForeachObject", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test4ForeachObject_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L609-L611";
        var pButtonWidths = {};
        pButtonWidths.a = 1;
        pButtonWidths.b = 2;
        pButtonWidths.c = 3;
        pButtonWidths.d = 4;
        var sum = "";
        for (var __$nflvKey in pButtonWidths) {
            var tW = pButtonWidths[__$nflvKey];
            sum += String(tW);
        }
        var testVO = new TestVO_1.TestVO(this.test4ForeachObject_Order, "test4ForeachObject_Order", ref, "3142", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test5ForClassic = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/RNGTester.as#L12-L14";
        var sum = 0;
        for (var i = 1; i < 4; i++) {
            sum += i;
        }
        var testVO = new TestVO_1.TestVO(this.test5ForClassic, "test5ForClassic", ref, 6, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test5ForClassic_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/RNGTester.as#L12-L14";
        var sum = "";
        for (var i = 1; i < 4; i++) {
            sum += String(i);
        }
        var testVO = new TestVO_1.TestVO(this.test5ForClassic_Order, "test5ForClassic_Order", ref, "123", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test6ForCComplexCondition = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L790-L792";
        var i;
        var Managers = {};
        Managers.pUser = {};
        Managers.pUser.pUserRole = 1;
        var sum = 0;
        for (i = 0; i < (Managers.pUser.pUserRole == LoopTests.staticVar1 ? 2 : 1); i++) {
            sum += i;
        }
        var testVO = new TestVO_1.TestVO(this.test6ForCComplexCondition, "test6ForCComplexCondition", ref, 1, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test6ForCComplexCondition_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L790-L792";
        var i;
        var Managers = {};
        Managers.pUser = {};
        Managers.pUser.pUserRole = 1;
        var sum = "";
        for (i = 0; i < (Managers.pUser.pUserRole == LoopTests.staticVar1 ? 2 : 1); i++) {
            sum += String(i);
        }
        var testVO = new TestVO_1.TestVO(this.test6ForCComplexCondition_Order, "test6ForCComplexCondition_Order", ref, "01", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    /*
     public function test7ForXML():Boolean
     {

     }*/
    LoopTests.prototype.test7WhileClassic = function () {
        var ref = "--";
        var sum = 0;
        var pRecentActivities = [1, 2, 3, 4, 5, 6];
        var pMaxRecentActivities = 4;
        while (pRecentActivities.length > pMaxRecentActivities) {
            sum += pRecentActivities.pop();
        }
        var testVO = new TestVO_1.TestVO(this.test7WhileClassic, "test7WhileClassic", ref, 11, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test7WhileClassic_Order = function () {
        var ref = "--";
        var sum = "";
        var pRecentActivities = [1, 2, 3, 4, 5, 6];
        var pMaxRecentActivities = 4;
        while (pRecentActivities.length > pMaxRecentActivities) {
            sum += String(pRecentActivities.pop());
        }
        var testVO = new TestVO_1.TestVO(this.test7WhileClassic_Order, "test7WhileClassic_Order", ref, "65", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test8WhileSpecChars_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L1456-1459";
        var tTxt = "line1\n\nline2\n\nline3\n\nline4";
        while (tTxt.indexOf("\n\n") >= 0) {
            tTxt = tTxt.split("\n\n").join("\n");
        }
        var testVO = new TestVO_1.TestVO(this.test8WhileSpecChars_Order, "test8WhileSpecChars_Order", ref, "line1\nline2\nline3\nline4", tTxt);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test8WhileWithFunc_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/resource/Re.as#L315-L317";
        var pResourceRoot = {};
        var tSection = 5;
        var pLastRePositionSection = 3;
        pResourceRoot.fGetRePosition = function (value) {
            return "";
        };
        var sum = "";
        while (pResourceRoot.fGetRePosition(tSection) == "" && tSection > pLastRePositionSection) {
            sum += String(tSection--);
        }
        var testVO = new TestVO_1.TestVO(this.test8WhileWithFunc_Order, "test8WhileWithFunc_Order", ref, "54", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.test9NestedWileDo_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/blob/master/tests/full-as3/srcMain/shared/particles/Solute.as#L194-L228";
        var i = 1;
        var k = 8;
        var sum = "";
        while (k > 5) {
            do {
                i++;
                sum += (String(i) + "-" + String(k) + ";");
            } while (i < 5);
            k--;
        }
        var testVO = new TestVO_1.TestVO(this.test9NestedWileDo_Order, "test9NestedWileDo_Order", ref, "2-8;3-8;4-8;5-8;6-7;7-6;", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.testOffArrayForInDiscontinuous = function () {
        var ref = "--";
        var arr = [];
        arr[1] = 2;
        arr[3] = 5;
        arr[5] = 7;
        var sum = "";
        var key;
        for (key in arr) {
            sum += String(arr[key]);
        }
        var testVO = new TestVO_1.TestVO(this.testOffArrayForInDiscontinuous, "testOffArrayForInDiscontinuous", ref, "257", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.prototype.testOffObjectForIn_Order = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/blob/master/tests/full-as3/srcMain/shared/MovieManager.as#L302-L304";
        var obj = {};
        obj.a = 2;
        obj.b = 5;
        obj.c = 7;
        obj.c = 8;
        var sum = "";
        var key;
        for (key in obj) {
            sum += String(obj[key]);
        }
        var testVO = new TestVO_1.TestVO(this.testOffObjectForIn_Order, "testOffObjectForIn_Order", ref, "825", sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTests.staticVar1 = 1;
    return LoopTests;
}());
exports.LoopTests = LoopTests;
var TestVO = (function () {
    function TestVO(func, caption, ref, expected, result) {
        this._func = func;
        this._caption = caption;
        this._ref = ref;
        this._expected = expected;
        this._result = result;
        this._isValid = expected === result;
    }
    Object.defineProperty(TestVO.prototype, "func", {
        get: function () { return this._func; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestVO.prototype, "caption", {
        get: function () { return this._caption; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestVO.prototype, "ref", {
        get: function () { return this._ref; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestVO.prototype, "expected", {
        get: function () { return this._expected; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestVO.prototype, "result", {
        get: function () { return this._result; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestVO.prototype, "isValid", {
        get: function () { return this._isValid; },
        enumerable: true,
        configurable: true
    });
    return TestVO;
}());
