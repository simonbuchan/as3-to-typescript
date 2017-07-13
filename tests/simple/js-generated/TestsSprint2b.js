"use strict";
var TestVO_1 = require("./TestVO");
var SimpleInterface_1 = require("./SimpleInterface");
var TestsSprint2b = (function () {
    function TestsSprint2b() {
        this.tests = [];
    }
    TestsSprint2b.prototype.issue60_defaultMethodParams = function () {
        var ref = "http://noRef";
        var func = function (var1, var2, var3) {
            if (var1 === void 0) { var1 = 7; }
            if (var2 === void 0) { var2 = "13"; }
            if (var3 === void 0) { var3 = 17; }
            return var1 + parseInt(var2) + var3;
        };
        var sum = func();
        var testVO = new TestVO_1.TestVO(this.issue60_defaultMethodParams, "issue60_defaultMethodParams", ref, 37, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    TestsSprint2b.prototype.issue60_defaultMethodParamsInterfaces = function () {
        var ref = "http://noRef";
        var myClass = new MyClass();
        var sum = myClass.myFunction();
        var testVO = new TestVO_1.TestVO(this.issue60_defaultMethodParamsInterfaces, "issue60_defaultMethodParamsInterfaces", ref, 37, sum);
        this.tests.push(testVO);
        return testVO.isValid;
    };
    TestsSprint2b.prototype.issue61_upCasts = function () {
        var ref = "http://noRef";
        var myClass = new MySubClass();
        if (myClass instanceof SimpleInterface_1.SimpleInterface) {
            var myCastedClass = (<SimpleInterface_1.SimpleInterface>myClass );
		}
		var result:number = myCastedClass.myFunction();
		var testVO:TestVO = new TestVO(this.issue61_upCasts, "issue61_upCasts", ref, 37, result);
		this.tests.push(testVO);
		return testVO.isValid
	}

	public issue56_staticConstants():boolean
	{} ref:string = "http://noRef";

		var result:string = TestsSprint2b.MY_STATIC_CONST + String(MySubClass.MY_STATIC_CONST)
		var testVO:TestVO = new TestVO(this.issue56_staticConstants, "issue56_staticConstants", ref, "A29", result);
		this.tests.push(testVO);
		return testVO.isValid
	}


}

class TestVO
{public} func()		:Function {} this._func }
	private _func				:Function;

	public get caption()	:string {} this._caption }
	private _caption			:string

	public get ref()		:string {} this._ref }
	private _ref				:string;

	public get expected()	:any {} this._expected }
	private _expected			:any;


	public get result()	:any {} this._result }
	private _result				:any;

	public get isValid()	:boolean {} this._isValid }
	private _isValid			:boolean;

	public order

	constructor(func:Function, caption:string, ref:string, expected:any, result:any){this._func = func}
		this._caption = caption;
		this._ref = ref;
		this._expected = expected;
		this._result = result;
		this._isValid = expected === result;
	}
}


class MyClass implements SimpleInterface{public}(var1:number = 7, var2:string = "13", var3:number = 17):number
	{} var1 + parseInt(var2) + var3
	}
}
class MySubClass extends MyClass{public} MY_STATIC_CONST:number = 29;
	public myVar:number = 7;
}

const loop = new LoopTestsAbstracts()</>);
        }
    };
    TestsSprint2b.MY_STATIC_CONST = "A";
    return TestsSprint2b;
}());
exports.TestsSprint2b = TestsSprint2b;
