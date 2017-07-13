/**
 * Created by Ushan on 15.06.2017.
 */
package
{
import flash.utils.Dictionary;


public class LoopTests
{
	//----------------------------------------------------------------------
	//	public fields
	//----------------------------------------------------------------------
	public var tests:Vector.<TestVO> = new <TestVO>[];

	//----------------------------------------------------------------------
	//	private fields
	//----------------------------------------------------------------------

	//----------------------------------------------------------------------
	//
	//	constructor
	//
	//----------------------------------------------------------------------
	public function LoopTests()
	{

		test1ForeachComplex();
		test1ForeachComplex_Order();
		test2ForeachVector();
		test2ForeachVector_Order();
		test3ForeachArray();
		test3ForeachArray_Order();
		test4ForeachObject();
		test4ForeachObject_Order();
		test5ForClassic();
		test5ForClassic_Order();
		test6ForCComplexCondition();
		test6ForCComplexCondition_Order();
		test7WhileClassic();
		test7WhileClassic_Order();
		test8WhileSpecChars_Order();
		test9NestedWileDo_Order();
		testOffArrayForInDiscontinuous();
		testOffObjectForIn_Order();
		for (var i:int = 0; i < tests.length; i++)
		{
			var testVO:TestVO = tests[i];
			trace(testVO.caption + "\t\t", testVO.isValid + "\t\t", " expected:" + testVO.expected, " result:" + testVO.result, testVO.ref);

		}

	}

	public function test1ForeachComplex():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/Preloader.as#L96-L101";
		var Managers:Object = {};
		Managers.pUser = {};
		Managers.pUser.pLanguages = {};
		Managers.pUser.pLanguages.a = 1;
		Managers.pUser.pLanguages.b = 2;
		Managers.pUser.pLanguages.c = 3;
		Managers.pUser.pLanguages.d = 4;

		var sum:Number = 0;

		for each (var tLang:String in Managers.pUser.pLanguages)
		{
			sum += parseInt(tLang)
		}
		var testVO:TestVO = new TestVO(test1ForeachComplex, "test1ForeachNoOrderComplex", ref, 10, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test1ForeachComplex_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/Preloader.as#L96-L101";
		var Managers:Object = {};
		Managers.pUser = {};
		Managers.pUser.pLanguages = {};
		Managers.pUser.pLanguages.a = "1";
		Managers.pUser.pLanguages.b = "2";
		Managers.pUser.pLanguages.c = "3";
		Managers.pUser.pLanguages.d = "4";


		var sum:String = ""

		for each (var tLang:String in Managers.pUser.pLanguages)
		{
			sum += tLang
		}

		var testVO:TestVO = new TestVO(test1ForeachComplex_Order, "test1ForeachComplex_Order", ref, "3142", sum);
		tests.push(testVO);
		return testVO.isValid
	}




	public function test2ForeachVector():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L172";
		var pSelectedResource:Array = [new <uint>[1,2,3,4]]
		var tVector:Vector.<uint> = pSelectedResource[0] as Vector.<uint>
		var sum:Number = 0;
		for each (var tL:uint in tVector)
		{
			sum+=tL;
		}
		var testVO:TestVO = new TestVO(test2ForeachVector, "test2ForeachVector", ref, 10, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test2ForeachVector_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L172";
		var pSelectedResource:Array = [new <String>["1","2","3","4"]]
		var tVector:Vector.<String> = pSelectedResource[0] as Vector.<String>
		var sum:String = "";
		for each (var tL:String in tVector)
		{
			sum+=tL;
		}
		var testVO:TestVO = new TestVO(test2ForeachVector_Order, "test2ForeachVector_Order", ref, "1234", sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test3ForeachArray():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
		var pCurrentSelection:Array = [1,2,3,4];
		var tPath:Vector.<uint> = new Vector.<uint>
		var i:int;
		var sum:Number = 0;
		for each (i in pCurrentSelection)
		{
			tPath.push(i)
			sum += i;
		}
		var testVO:TestVO = new TestVO(test3ForeachArray, "test3ForeachArray", ref, 10, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test3ForeachArray_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
		var pCurrentSelection:Array = ["1","2","3","4"];
		var tPath:Vector.<uint> = new Vector.<uint>
		var i:int;
		var sum:String = "";
		for each (i in pCurrentSelection)
		{
			tPath.push(i)
			sum += String(i);
		}
		var testVO:TestVO = new TestVO(test3ForeachArray_Order, "test3ForeachArray_Order", ref, "1234", sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test4ForeachObject():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L609-L611";
		var pButtonWidths:Object = {}
		pButtonWidths.a = 1;
		pButtonWidths.b = 2;
		pButtonWidths.c = 3;
		pButtonWidths.d = 4;
		var sum:Number = 0;
		for each (var tW:Number in pButtonWidths)
		{
			sum += pButtonWidths[tW];

		}
		var testVO:TestVO = new TestVO(test4ForeachObject, "test4ForeachObject", ref, 10, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test4ForeachObject_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L609-L611";
		var pButtonWidths:Object = {}
		pButtonWidths.a = 1;
		pButtonWidths.b = 2;
		pButtonWidths.c = 3;
		pButtonWidths.d = 4;
		var sum:String = "";
		for each (var tW:Number in pButtonWidths)
		{
			sum += String(tW);

		}
		var testVO:TestVO = new TestVO(test4ForeachObject_Order, "test4ForeachObject_Order", ref, "3142", sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test5ForClassic():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/RNGTester.as#L12-L14";
		var sum:Number = 0;
		for (var i:int = 1; i < 4; i++) {
			sum += i
		}
		var testVO:TestVO = new TestVO(test5ForClassic, "test5ForClassic", ref, 6, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test5ForClassic_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/RNGTester.as#L12-L14";
		var sum:String = "";
		for (var i:int = 1; i < 4; i++) {
			sum += String(i)
		}
		var testVO:TestVO = new TestVO(test5ForClassic_Order, "test5ForClassic_Order", ref, "123", sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public static var staticVar1:int = 1;
	public function test6ForCComplexCondition():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L790-L792";
		var i:int
		var Managers:Object = {};
		Managers.pUser = {};
		Managers.pUser.pUserRole = 1;
		var sum:Number = 0;
		for (i = 0; i < (Managers.pUser.pUserRole == LoopTests.staticVar1 ? 2 : 1); i++)
		{
			sum += i
		}
		var testVO:TestVO = new TestVO(test6ForCComplexCondition, "test6ForCComplexCondition", ref, 1, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test6ForCComplexCondition_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L790-L792";
		var i:int
		var Managers:Object = {};
		Managers.pUser = {};
		Managers.pUser.pUserRole = 1;
		var sum:String = "";
		for (i = 0; i < (Managers.pUser.pUserRole == LoopTests.staticVar1 ? 2 : 1); i++)
		{
			sum += String(i)
		}
		var testVO:TestVO = new TestVO(test6ForCComplexCondition_Order, "test6ForCComplexCondition_Order", ref, "01", sum);
		tests.push(testVO);
		return testVO.isValid
	}
	/*
	 public function test7ForXML():Boolean
	 {

	 }*/
	public function test7WhileClassic():Boolean
	{
		var ref:String = "--";
		var sum:Number = 0;
		var pRecentActivities:Array = [1,2,3,4,5,6];
		var pMaxRecentActivities:int = 4;
		while (pRecentActivities.length > pMaxRecentActivities)
		{

			sum +=pRecentActivities.pop();
		}
		var testVO:TestVO = new TestVO(test7WhileClassic, "test7WhileClassic", ref, 11, sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test7WhileClassic_Order():Boolean
	{
		var ref:String = "--";
		var sum:String = "";
		var pRecentActivities:Array = [1,2,3,4,5,6];
		var pMaxRecentActivities:int = 4;
		while (pRecentActivities.length > pMaxRecentActivities)
		{

			sum +=String(pRecentActivities.pop());
		}
		var testVO:TestVO = new TestVO(test7WhileClassic_Order, "test7WhileClassic_Order", ref, "65", sum);
		tests.push(testVO);
		return testVO.isValid
	}


	public function test8WhileSpecChars_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L1456-1459"
		var tTxt:String = "line1\n\nline2\n\nline3\n\nline4"
		while (tTxt.indexOf("\n\n") >= 0)
		{
			tTxt = tTxt.split("\n\n").join("\n")
		}
		var testVO:TestVO = new TestVO(test8WhileSpecChars_Order, "test8WhileSpecChars_Order", ref, "line1\nline2\nline3\nline4", tTxt);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test8WhileWithFunc_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/resource/Re.as#L315-L317"
		var pResourceRoot:Object = {}
		var tSection:int = 5;
		var pLastRePositionSection:int = 3;
		pResourceRoot.fGetRePosition = function(value:int):String
		{
			return ""
		}
		var sum:String = ""
		while (pResourceRoot.fGetRePosition(tSection) == "" && tSection > pLastRePositionSection) {
			sum += String(tSection--)

		}
		var testVO:TestVO = new TestVO(test8WhileWithFunc_Order, "test8WhileWithFunc_Order", ref, "54", sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function test9NestedWileDo_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/blob/master/tests/full-as3/srcMain/shared/particles/Solute.as#L194-L228"
		var i:int = 1;
		var k:int = 8;
		var sum:String = ""
		while (k > 5)
		{
			do
			{
				i++
				sum += (String(i) + "-" + String(k) + ";")
			} while (i < 5)
			k--

		}
		var testVO:TestVO = new TestVO(test9NestedWileDo_Order, "test9NestedWileDo_Order", ref, "2-8;3-8;4-8;5-8;6-7;7-6;", sum);
		tests.push(testVO);
		return testVO.isValid
	}


	public function testOffArrayForInDiscontinuous():Boolean
	{
		var ref:String = "--";
		var arr:Array = [];
		arr[1] = 2;
		arr[3] = 5;
		arr[5] = 7;
		var sum:String = "";
		for  (var key:int in arr)
		{
			sum += String(arr[key]);
		}
		var testVO:TestVO = new TestVO(testOffArrayForInDiscontinuous, "testOffArrayForInDiscontinuous", ref, "257", sum);
		tests.push(testVO);
		return testVO.isValid
	}

	public function testOffObjectForIn_Order():Boolean
	{
		var ref:String = "https://github.com/awaystudios/sunflower-ts/blob/master/tests/full-as3/srcMain/shared/MovieManager.as#L302-L304";
		var obj:Object = {};

		obj.a = 2;
		obj.b = 5;
		obj.c = 7;
		obj.c = 8;
		var sum:String = "";
		for  (var key:String in obj)
		{
			sum += String(obj[key]);
		}
		var testVO:TestVO = new TestVO(testOffObjectForIn_Order, "testOffObjectForIn_Order", ref, "825", sum);
		tests.push(testVO);
		return testVO.isValid
	}
	//----------------------------------------------------------------------
	//
	//	private methods
	//
	//----------------------------------------------------------------------


}
}

class TestVO
{
	public function get func()		:Function {return _func }
	private var _func				:Function;

	public function get caption()	:String {   return _caption }
	private var _caption			:String;

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
    

