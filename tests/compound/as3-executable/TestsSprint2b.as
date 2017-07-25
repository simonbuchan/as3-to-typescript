package
{
public class TestsSprint2b
{
	public var tests:Array = [];
	public static const MY_STATIC_CONST:String = "A";
	public function TestsSprint2b()
	{
	}

	public function issue60_defaultMethodParams():Boolean
	{
		var ref:String = "http://noRef";
		var func:Function = function(var1:Number = 7, var2:String = "13", var3:uint = 17):Number{
			return var1 + parseInt(var2) + var3
		}
		var sum:Number = func();
		var testVO:TestVO = new TestVO(issue60_defaultMethodParams, "issue60_defaultMethodParams", ref, 37, sum);
		tests.push(testVO);
		return testVO.isValid
	}
	public function issue60_defaultMethodParamsInterfaces():Boolean
	{
		var ref:String = "http://noRef";
		var myClass:MyClass = new MyClass();

		var sum:Number = myClass.myFunction();
		var testVO:TestVO = new TestVO(issue60_defaultMethodParamsInterfaces, "issue60_defaultMethodParamsInterfaces", ref, 37, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function issue61_upCasts():Boolean
	{
		var ref:String = "http://noRef";
		var myClass:MyClass = new MySubClass();
		if (myClass is SimpleInterface)
		{
			var myCastedClass:SimpleInterface = myClass as  SimpleInterface;
		}
		var result:Number = myCastedClass.myFunction();
		var testVO:TestVO = new TestVO(issue61_upCasts, "issue61_upCasts", ref, 37, result);
		tests.push(testVO);
		return testVO.isValid
	}

	public function issue56_staticConstants():Boolean
	{
		var ref:String = "http://noRef";

		var result:String = MY_STATIC_CONST + String(MySubClass.MY_STATIC_CONST)
		var testVO:TestVO = new TestVO(issue56_staticConstants, "issue56_staticConstants", ref, "A29", result);
		tests.push(testVO);
		return testVO.isValid
	}


}
}
class TestVO
{
	public function get func()		:Function {return _func }
	private var _func				:Function;

	public function get caption()	:String {   return _caption }
	private var _caption			:String

	public function get ref()		:String {   return _ref }
	private var _ref				:String;

	public function get expected()	:* {   return _expected }
	private var _expected			:*;


	public function get result()	:* {return _result }
	private var _result				:*;

	public function get isValid()	:Boolean {   return _isValid }
	private var _isValid			:Boolean;

	public var order

	public function TestVO(func:Function, caption:String, ref:String, expected:*, result:*)
	{
		_func = func;
		_caption = caption;
		_ref = ref;
		_expected = expected;
		_result = result;
		_isValid = expected === result;
	}
}


class MyClass implements SimpleInterface{
	public function myFunction(var1:Number = 7, var2:String = "13", var3:uint = 17):Number
	{
		return var1 + parseInt(var2) + var3
	}
}
class MySubClass extends MyClass{
	public static const MY_STATIC_CONST:Number = 29;
	public var myVar:Number = 7;
}

const loop = new LoopTestsAbstracts();