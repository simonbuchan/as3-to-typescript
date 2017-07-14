package
{
import flash.utils.setTimeout;

public class ScopeTest extends ParentClassHelper
{

	public var myVar1		:String = "A1";
	private var myVar2		:String = "A2";
	public var funcRef				:Function;
	public var funcRefToPrivate		:Function;
	public var result			:String;
	public var  mySubClass	:MySubClass
	public function ScopeTest()
	{
		//add super
		mySubClass = new MySubClass(this);
		LogTests.log(2, "Constructor,this:",  String(this), THIS_TO_STRING);
		LogTests.log(2, "Constructor::this.myVar1:",  this.myVar1, "A1");
		LogTests.log(2, "Constructor::this.myVar2:",  this.myVar2, "A2");
		LogTests.log(2, "Constructor::myVar1:",  myVar1, "A1");
		LogTests.log(2, "Constructor::myVar2:",  myVar2, "A2");
		memberFunc();
		mySubClass.run();
		mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
	}

	public function memberFunc():void
	{

		var myVar1:String = "B1";
		LogTests.log(2, "memberFunc,this:",  String(this), THIS_TO_STRING);
		LogTests.log(2, "memberFunc::this.myVar1:",  this.myVar1, "A1");
		LogTests.log(2, "memberFunc::this.myVar2:",  this.myVar2, "A2");
		LogTests.log(2, "memberFunc::myVar1:",  myVar1, "B1");
		LogTests.log(2, "memberFunc::myVar2:",  myVar2, "null");
		result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
		LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
		setTimeout(function()
		{
			var myVar1:String = "C1";

			LogTests.log(2, "setTimeout,this:",  String(this), [GLOBAL_TO_STRING, THIS_TO_STRING]);
			LogTests.log(2, "setTimeout::this.myVar1:",  this.myVar1, ["null", "A1"]);
			LogTests.log(2, "setTimeout::this.myVar2:",  this.myVar2, ["null", "A2"]);
			LogTests.log(2, "setTimeout::myVar1:",  myVar1, "C1");
			LogTests.log(2, "setTimeout::myVar2:",  myVar2, "B2");
			result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
			LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");;
		}, 0);
		var myVar2:String = "B2";
		var funcVariable:Function = function (whoCalls:String):String{
			var myVar1:String = "D1";

			switch (whoCalls)
			{
				case RIGHT_AWAY_DEFINITION:
					LogTests.log(2, "funcVariable,this:" + whoCalls,  String(this), [GLOBAL_TO_STRING, THIS_TO_STRING]);
					LogTests.log(2, "funcVariable::this.myVar1:" + whoCalls,  this.myVar1, ["null", "A1"]);
					LogTests.log(2, "funcVariable::this.myVar2:" + whoCalls,  this.myVar2, ["null", "A2"]);
					LogTests.log(2, "funcVariable::myVar1:" + whoCalls,  myVar1, "D1");
					LogTests.log(2, "funcVariable::myVar2:" + whoCalls,  myVar2, "B2");
					result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
					LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
					break;
				case SET_TIMEOUT_LOCAL :
					LogTests.log(2, "funcVariable,this:" + whoCalls,  String(this), [GLOBAL_TO_STRING, THIS_TO_STRING]);
					LogTests.log(2, "funcVariable::this.myVar1:" + whoCalls,  this.myVar1, ["null", "A1"]);
					LogTests.log(2, "funcVariable::this.myVar2:" + whoCalls,  this.myVar2, ["null", "A2"]);
					LogTests.log(2, "funcVariable::myVar1:" + whoCalls,  myVar1, "D1");
					LogTests.log(2, "funcVariable::myVar2:" + whoCalls,  myVar2, "B2");
					result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
					LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
					break;
				case SET_TIMEOUT_EXTERNAL :
					LogTests.log(2, "funcVariable,this:" + whoCalls,  String(this), GLOBAL_TO_STRING);
					LogTests.log(2, "funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "null");
					LogTests.log(2, "funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "null");
					LogTests.log(2, "funcVariable::myVar1:" + whoCalls,  myVar1, "D1");
					LogTests.log(2, "funcVariable::myVar2:" + whoCalls,  myVar2, "B2");
					result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
					LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
					break;
				case FROM_EXTERNAL_CLASS :
					LogTests.log(2, "funcVariable,this:" + whoCalls,  String(this), THIS_TO_STRING);
					LogTests.log(2, "funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "A1");
					LogTests.log(2, "funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "A2");
					LogTests.log(2, "funcVariable::myVar1:" + whoCalls,  myVar1, "D1");
					LogTests.log(2, "funcVariable::myVar2:" + whoCalls,  myVar2, "B2");
					result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
					LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
					break;
				case AS_CALLBACK :
					LogTests.log(2, "funcVariable,this:" + whoCalls,  String(this), THIS_TO_STRING);
					LogTests.log(2, "funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "A1");
					LogTests.log(2, "funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "A2");
					LogTests.log(2, "funcVariable::myVar1:" + whoCalls,  myVar1, "A1");
					LogTests.log(2, "funcVariable::myVar2:" + whoCalls,  myVar2, "A2");
					result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
					LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
					break;
				case FROM_CONSTRUCTOR :
					LogTests.log(2, "funcVariable,this:" + whoCalls,  String(this), THIS_TO_STRING);
					LogTests.log(2, "funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "A1");
					LogTests.log(2, "funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "A2");
					LogTests.log(2, "funcVariable::myVar1:" + whoCalls,  myVar1, "A1");
					LogTests.log(2, "funcVariable::myVar2:" + whoCalls,  myVar2, "A2");
					result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
					LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
					break;
			}

			result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
			LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
			result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);
			LogTests.log(1, "callBackResult:",  result, "A1A2A1A2Pr");
			return this.myVar1 + this.myVar2 + myVar1 +  myVar2 + "Vr";
		}
		funcRef = funcVariable;
		funcRefToPrivate = myPrivateFunc;
		var result1:String = funcVariable(RIGHT_AWAY_DEFINITION);
		LogTests.log(1, "memberFunc::myVar2:Result",  result1, ["NaND1B2Vr", "A1A2D1B2Vr"]);
		funcVariable(RIGHT_AWAY_DEFINITION);
		setTimeout(funcVariable, 100, SET_TIMEOUT_LOCAL);
		setTimeout(this.myPublicFunc, 200, SET_TIMEOUT_LOCAL);
		result = mySubClass.myFunction(myPrivateFunc, AS_CALLBACK);


	}

	private function myPrivateFunc(whoCalls:String = ""):String
	{
		switch (whoCalls)
		{
			case RIGHT_AWAY_DEFINITION:
				LogTests.log(2, "myPrivateFunc,this:" + whoCalls,  String(this), GLOBAL_TO_STRING);
				LogTests.log(2, "myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPrivateFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case SET_TIMEOUT_LOCAL :
				LogTests.log(2, "myPrivateFunc,this:" + whoCalls,  String(this), GLOBAL_TO_STRING);
				LogTests.log(2, "myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPrivateFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case SET_TIMEOUT_EXTERNAL :
				LogTests.log(2, "myPrivateFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPrivateFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case FROM_EXTERNAL_CLASS :
				LogTests.log(2, "myPrivateFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPrivateFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case AS_CALLBACK :
				LogTests.log(2, "myPrivateFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPrivateFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case FROM_CONSTRUCTOR :
				LogTests.log(2, "myPrivateFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPrivateFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPrivateFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
		}
		return this.myVar1 + this.myVar2 + myVar1 +  myVar2 + "Pr";
	}
	public function myPublicFunc(whoCalls:String = ""):String
	{

		switch (whoCalls)
		{
			case RIGHT_AWAY_DEFINITION:
				LogTests.log(2, "myPublicFunc,this:" + whoCalls,  String(this), "[object global]");
				LogTests.log(2, "myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPublicFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPublicFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case SET_TIMEOUT_LOCAL :
				LogTests.log(2, "myPublicFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPublicFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPublicFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case SET_TIMEOUT_EXTERNAL :
				LogTests.log(2, "myPublicFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPublicFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPublicFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case FROM_EXTERNAL_CLASS :
				LogTests.log(2, "myPublicFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPublicFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPublicFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case AS_CALLBACK :
				LogTests.log(2, "myPublicFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPublicFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPublicFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
			case FROM_CONSTRUCTOR :
				LogTests.log(2, "myPublicFunc,this:" + whoCalls,  String(this), THIS_TO_STRING);
				LogTests.log(2, "myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "A1");
				LogTests.log(2, "myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "A2");
				LogTests.log(2, "myPublicFunc::myVar1:" + whoCalls,  myVar1, "A1");
				LogTests.log(2, "myPublicFunc::myVar2:" + whoCalls,  myVar2, "A2");
				break;
		}
		return this.myVar1 + this.myVar2 + myVar1 +  myVar2 + "Pb";
	}

	override public function myMethod(value:String = "D"):String
	{
		return "B" + value;
	}


	public function toString():String
	{
		return THIS_TO_STRING
	}

	public static const THIS_TO_STRING			:String = "[object ScopeTest]";
	public static const GLOBAL_TO_STRING			:String = "[object global]";
	public static const SET_TIMEOUT_LOCAL		:String = "/fromSetTimeoutLocal/";
	public static const SET_TIMEOUT_EXTERNAL	:String = "/fromsetTimeoutExternal/";
	public static const RIGHT_AWAY_DEFINITION	:String = "/rightAwayDefinition/";
	public static const FROM_EXTERNAL_CLASS		:String = "/fromExternalClass/";
	public static const AS_CALLBACK				:String = "/asCallback/";
	public static const FROM_CONSTRUCTOR		:String = "/fromConstructor/";


}
}

import flash.utils.setTimeout;

class MySubClass{
	public var main:ScopeTest;
	public function MySubClass(main:ScopeTest):void
	{
		this.main = main;

	}

	public function run():void
	{
		main.funcRef(ScopeTest.FROM_EXTERNAL_CLASS)
		var result1:String = main.funcRef(ScopeTest.FROM_EXTERNAL_CLASS);
		var result2:String = main.funcRefToPrivate(ScopeTest.FROM_EXTERNAL_CLASS);
		setTimeout(main.funcRefToPrivate, 400, ScopeTest.SET_TIMEOUT_EXTERNAL);
		LogTests.log(1, "FuncRefResult:",  result1, "A1A2D1B2Vr");
		LogTests.log(1, "funcRefToPrivate:",  result2, "A1A2A1A2Pr");
	}

	public function myFunction(callBack:Function, whoCall:String):String
	{
		return callBack(whoCall);
	}

}

class LogTests{
	public static var counter:int = 0;
	static function log(verbose:int, id:String, out:String, expected:*):void
	{
		counter++;
		var isPassed:Boolean;
		var areEqual:Boolean;
		if (expected is Array)
		{
			isPassed =  (expected as Array).indexOf(String(out)) >= 0;
			areEqual = String(out) == expected[0];
		}
		else
		{
			isPassed = String(out) == expected;
			areEqual = isPassed;
		}
		var areEqualString:String = areEqual ? "==" : "!=";

		if (String(out) == "undefined" && expected == "null") isPassed = true;
		if (String(out) == "null" && expected == "undefined") isPassed = true;
		trace(counter + ":" +isPassed + " (" + areEqualString +  ") :\t\tid=" + id, "out=" + out, "expected=" + expected);
	}
}

const test = new ScopeTest();