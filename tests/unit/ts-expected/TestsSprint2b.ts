import { TestVO } from "./TestVO";
import { SimpleInterface } from "./SimpleInterface";

export class TestsSprint2b
{
	public tests:any[] = [];
	public static MY_STATIC_CONST:string = "A";
	constructor(){
	}

	public issue60_defaultMethodParams():boolean
	{
		var ref:string = "http://noRef";
		var func:Function = function(var1:number = 7, var2:string = "13", var3:number = 17):number{
			return var1 + parseInt(var2) + var3
		}
		var sum:number = func();
		var testVO:TestVO = new TestVO(this.issue60_defaultMethodParams, "issue60_defaultMethodParams", ref, 37, sum);
		this.tests.push(testVO);
		return testVO.isValid
	}
	public issue60_defaultMethodParamsInterfaces():boolean
	{
		var ref:string = "http://noRef";
		var myClass:MyClass = new MyClass();

		var sum:number = myClass.myFunction();
		var testVO:TestVO = new TestVO(this.issue60_defaultMethodParamsInterfaces, "issue60_defaultMethodParamsInterfaces", ref, 37, sum);
		this.tests.push(testVO);
		return testVO.isValid
	}

	public issue61_upCasts():boolean
	{
		var ref:string = "http://noRef";
		var myClass:MyClass = new MySubClass();
		if (myClass instanceof SimpleInterface)
		{
			var myCastedClass:SimpleInterface = (<SimpleInterface>myClass );
		}
		var result:number = myCastedClass.myFunction();
		var testVO:TestVO = new TestVO(this.issue61_upCasts, "issue61_upCasts", ref, 37, result);
		this.tests.push(testVO);
		return testVO.isValid
	}

	public issue56_staticConstants():boolean
	{
		var ref:string = "http://noRef";

		var result:string = TestsSprint2b.MY_STATIC_CONST + String(MySubClass.MY_STATIC_CONST)
		var testVO:TestVO = new TestVO(this.issue56_staticConstants, "issue56_staticConstants", ref, "A29", result);
		this.tests.push(testVO);
		return testVO.isValid
	}


}

class TestVO
{
	public get func()		:Function {return this._func }
	private _func				:Function;

	public get caption()	:string {   return this._caption }
	private _caption			:string

	public get ref()		:string {   return this._ref }
	private _ref				:string;

	public get expected()	:any {   return this._expected }
	private _expected			:any;


	public get result()	:any {return this._result }
	private _result				:any;

	public get isValid()	:boolean {   return this._isValid }
	private _isValid			:boolean;

	public order

	constructor(func:Function, caption:string, ref:string, expected:any, result:any){
		this._func = func;
		this._caption = caption;
		this._ref = ref;
		this._expected = expected;
		this._result = result;
		this._isValid = expected === result;
	}
}


class MyClass implements SimpleInterface{
	public myFunction(var1:number = 7, var2:string = "13", var3:number = 17):number
	{
		return var1 + parseInt(var2) + var3
	}
}
class MySubClass extends MyClass{
	public static MY_STATIC_CONST:number = 29;
	public myVar:number = 7;
}

const loop = new LoopTestsAbstracts()