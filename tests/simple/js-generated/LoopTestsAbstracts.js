"use strict";
var TestVO_1 = require("./TestVO");
var MappedClass_1 = require("./MappedClass");
var LoopTestsAbstracts = (function () {
    function LoopTestsAbstracts() {
        this.tests = [];
        this.valueNoType = 100;
        this.valueProp = 200;
        this.keyVariable = "e";
        this.forEach1Simple();
        this.forEach2VarPredefined();
        this.forEach2NoDeclaration();
        this.forEach2VarIsProperty();
        this.forEach2VarIsPropertyTyped();
        this.forEach3ClassMapped();
        this.forEach4ClassMappedVarPredefined();
        this.forEach5Array();
        //		forEach6Vector();
        //		forEach6VectorVarPredefined();
        this.for7Array();
        this.for8Array();
        this.for9Array();
        this.forIn10ArrayString();
        this.forIn11ArrayUntyped();
        this.forIn12Object();
        this.forIn13ObjectTyped();
        this.forIn14ObjectTypedVarPredefined();
        this.forIn14KeyIsProperty();
        //		forIn15VectorString();
        //		forIn16VectorVarPredefined();
        //		forIn17VectorUntyped();
        this.forEach3ClassMapped_noSemi();
        for (var i = 0; i < this.tests.length; i++) {
            var testVO = this.tests[i];
            console.log(testVO.caption + "\t\t", testVO.isValid + "\t\t", " expected:" + testVO.expected, " result:" + testVO.result, testVO.ref);
        }
    }
    LoopTestsAbstracts.prototype.forEach1Simple = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        for (var __$nflvKey in myObj) {
            var value = myObj[__$nflvKey];
            sum += value;
        }
        var testVO = new TestVO_1.TestVO(this.forEach1Simple, "forEach1Simple", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach2VarPredefined = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var value;
        for (var __$nflvKey in myObj) {
            value = myObj[__$nflvKey];
            sum += value;
        }
        var testVO = new TestVO_1.TestVO(this.forEach2VarPredefined, "forEach2VarPredefined", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach2NoDeclaration = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var value = 300;
        var maxValue = 0; //for ignoring order
        for (var __$nflvKey in myObj) {
            value = myObj[__$nflvKey];
            sum += value;
            if (value > maxValue)
                maxValue = value;
        }
        sum += maxValue;
        var testVO = new TestVO_1.TestVO(this.forEach2NoDeclaration, "forEach2NoDeclaration", ref, 14, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach2VarIsProperty = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var maxValue = 0; //for ignoring order
        for (var __$nflvKey in myObj) {
            this.valueNoType = myObj[__$nflvKey];
            sum += this.valueNoType;
            if (this.valueNoType > maxValue)
                maxValue = this.valueNoType;
        }
        sum += maxValue;
        var testVO = new TestVO_1.TestVO(this.forEach2VarIsProperty, "forEach2VarIsProperty", ref, 14, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach2VarIsPropertyTyped = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var maxValue = 0; //for ignoring order
        for (var __$nflvKey in myObj) {
            this.valueProp = myObj[__$nflvKey];
            sum += this.valueProp;
            if (this.valueProp > maxValue)
                maxValue = this.valueProp;
        }
        sum += maxValue;
        var testVO = new TestVO_1.TestVO(this.forEach2VarIsPropertyTyped, "forEach2VarIsPropertyTyped", ref, 14, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach3ClassMapped = function () {
        var ref = "http://noRef";
        var myObj = {};
        var a = new MappedClass_1.MappedClass(1);
        myObj.a = a;
        var b = new MappedClass_1.MappedClass(2);
        myObj.b = b;
        var c = new MappedClass_1.MappedClass(3);
        myObj.c = c;
        var d = new MappedClass_1.MappedClass(4);
        myObj.d = d;
        var sum = 0;
        for (var __$nflvKey in myObj) {
            var value = myObj[__$nflvKey];
            sum += value.variable;
        }
        var testVO = new TestVO_1.TestVO(this.forEach3ClassMapped, "forEach3ClassMapped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach4ClassMappedVarPredefined = function () {
        var ref = "http://noRef";
        var myObj = {};
        var a = new MappedClass_1.MappedClass(1);
        myObj.a = a;
        var b = new MappedClass_1.MappedClass(2);
        myObj.b = b;
        var c = new MappedClass_1.MappedClass(3);
        myObj.c = c;
        var d = new MappedClass_1.MappedClass(4);
        myObj.d = d;
        var sum = 0;
        var value;
        for (var __$nflvKey in myObj) {
            value = myObj[__$nflvKey];
            sum += value.variable;
        }
        var testVO = new TestVO_1.TestVO(this.forEach4ClassMappedVarPredefined, "forEach4ClassMappedVarPredefined", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forEach5Array = function () {
        var ref = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
        var array = [1, 2, 3, 4];
        var i;
        var sum = 0;
        for (var __$nflvKey in array) {
            i = array[__$nflvKey];
            sum += i;
        }
        var testVO = new TestVO_1.TestVO(this.forEach5Array, "forEach5Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    /*	public function forEach6Vector():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var sum:Number = 0;
     for each (var i:int in vec)
     {
     sum += i;
     }
     var testVO:TestVO = new TestVO(forEach6Vector, "forEach6Vector", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/
    /*	public function forEach6VectorVarPredefined():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var i:int;
     var sum:Number = 0;
     for each (i in vec)
     {
     sum += i;
     }
     var testVO:TestVO = new TestVO(forEach6Vector, "forEach6Vector", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/
    LoopTestsAbstracts.prototype.for7Array = function () {
        var ref = "http://noRef";
        var array = [1, 2, 3, 4];
        var i;
        var sum = 0;
        for (var i = 0; i < array.length; i++) {
            sum += array[i];
        }
        var testVO = new TestVO_1.TestVO(this.for7Array, "for7Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.for8Array = function () {
        var ref = "http://noRef";
        var array = [1, 2, 3, 4];
        var i;
        var sum = 0;
        var i;
        for (i = 0; i < array.length; i++) {
            sum += array[i];
        }
        var testVO = new TestVO_1.TestVO(this.for8Array, "for8Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.for9Array = function () {
        var ref = "http://noRef";
        var array = [1, 2, 3, 4];
        var sum = 0;
        var i;
        for (i = 0; i < array.length; i++) {
            sum += array[i];
        }
        var testVO = new TestVO_1.TestVO(this.for9Array, "for9Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forIn10ArrayString = function () {
        var ref = "http://noRef";
        var array = [1, 2, 3, 4];
        var sum = 0;
        var v;
        for (v in array) {
            sum += array[v];
        }
        var testVO = new TestVO_1.TestVO(this.forIn10ArrayString, "forIn10ArrayString", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forIn11ArrayUntyped = function () {
        var ref = "http://noRef";
        var array = [1, 2, 3, 4];
        var sum = 0;
        var v;
        for (v in array) {
            sum += array[v];
        }
        var testVO = new TestVO_1.TestVO(this.forIn11ArrayUntyped, "forIn11ArrayUntyped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forIn12Object = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var key;
        for (key in myObj) {
            sum += myObj[key];
        }
        var testVO = new TestVO_1.TestVO(this.forIn12Object, "forIn12Object", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forIn13ObjectTyped = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var key;
        for (key in myObj) {
            sum += myObj[key];
        }
        var testVO = new TestVO_1.TestVO(this.forIn13ObjectTyped, "forIn13ObjectTyped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forIn14ObjectTypedVarPredefined = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var key;
        for (key in myObj) {
            sum += myObj[key];
        }
        var testVO = new TestVO_1.TestVO(this.forIn14ObjectTypedVarPredefined, "forIn14ObjectTypedVarPredefined", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    LoopTestsAbstracts.prototype.forIn14KeyIsProperty = function () {
        var ref = "http://noRef";
        var myObj = { a: 1, b: 2, c: 3, d: 4 };
        var sum = 0;
        var maxValue = 0; //for ignoring order in last iterated key
        for (this.keyVariable in myObj) {
            sum += myObj[this.keyVariable];
        }
        if (this.keyVariable == "d")
            sum = 1000;
        var testVO = new TestVO_1.TestVO(this.forIn14KeyIsProperty, "forIn14KeyIsProperty", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    /*	public function forIn15VectorString():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var sum:Number = 0;
     for (var key:String in vec)
     {
     sum += vec[key];
     }
     var testVO:TestVO = new TestVO(forIn15VectorString, "forIn15VectorString", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/
    /*	public function forIn16VectorVarPredefined():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var key:int;
     var sum:Number = 0;
     for (key in vec)
     {
     sum += vec[key];
     }
     var testVO:TestVO = new TestVO(forIn16VectorVarPredefined, "forIn16VectorVarPredefined", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/
    /*	public function forIn17VectorUntyped():Boolean
     {
     var ref:String = "http://noRef";
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var sum:Number = 0;
     for (var key in vec)
     {
     sum += vec[key];
     }
     var testVO:TestVO = new TestVO(forIn17VectorUntyped, "forIn17VectorUntyped", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/
    LoopTestsAbstracts.prototype.forEach3ClassMapped_noSemi = function () {
        var ref = "http://noRef";
        var myObj = {};
        var a = new MappedClass_1.MappedClass(1);
        myObj.a = a;
        var b = new MappedClass_1.MappedClass(2);
        myObj.b = b;
        var c = new MappedClass_1.MappedClass(3);
        myObj.c = c;
        var d = new MappedClass_1.MappedClass(4);
        myObj.d = d;
        var sum = 0;
        for (var __$nflvKey in myObj) {
            var value = myObj[__$nflvKey];
            sum += value.variable;
        }
        var testVO = new TestVO_1.TestVO(this.forEach3ClassMapped, "forEach3ClassMapped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    return LoopTestsAbstracts;
}());
exports.LoopTestsAbstracts = LoopTestsAbstracts;
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
var MappedClass = (function () {
    function MappedClass(variable) {
        this.variable = variable;
    }
    MappedClass.prototype.toString = function () {
        return String(this.variable);
    };
    return MappedClass;
}());
var loop = new LoopTestsAbstracts();
