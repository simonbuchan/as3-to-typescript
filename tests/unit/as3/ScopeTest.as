package
{
import flash.utils.setTimeout;

public class ScopeTest
{
	public var myVar1		:String = "classMember";
	private var myVar2		:String = "classMember";
	public var funcRef		:Function;
	public var funcRef2		:Function;
	public function ScopeTest()
	{
		//LogTests.log("Constructor,this:",  String(this), "[object ScopeTest]");
		LogTests.log("Constructor::this.myVar1:",  this.myVar1, "classMember");
		LogTests.log("Constructor::this.myVar2:",  this.myVar2, "classMember");
		LogTests.log("Constructor::myVar1:",  myVar1, "classMember");
		LogTests.log("Constructor::myVar2:",  myVar2, "classMember");
		memberFunc();
		var mySubClass:MySubClass = new MySubClass(this);
	}

	public function memberFunc():void
	{
		var myVar1:String = "memberFunc";
		//LogTests.log("memberFunc,this:",  String(this), "[object ScopeTest]");
		LogTests.log("memberFunc::this.myVar1:",  this.myVar1, "classMember");
		LogTests.log("memberFunc::this.myVar2:",  this.myVar2, "classMember");
		LogTests.log("memberFunc::myVar1:",  myVar1, "memberFunc");
		LogTests.log("memberFunc::myVar2:",  myVar2, "null");
		setTimeout(function()
		{
			var myVar1:String = "anonymous";

			//LogTests.log("setTimeout,this:",  String(this), "[object global]");
			LogTests.log("setTimeout::this.myVar1:",  this.myVar1, "null");
			LogTests.log("setTimeout::this.myVar2:",  this.myVar2, "null");
			LogTests.log("setTimeout::myVar1:",  myVar1, "anonymous");
			LogTests.log("setTimeout::myVar2:",  myVar2, "memberFunc");
		}, 0);
		var myVar2:String = "memberFunc";
		var funcVariable:Function = function (whoCalls:String){
			var myVar1:String = "funcVariable";

			switch (whoCalls)
			{
				case "external :":
					//LogTests.log ("funcVariable,this:" + whoCalls,  String(this), "[object ScopeTest]");
					if (this)
					{
						LogTests.log ("funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "classMember");
						LogTests.log ("funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "classMember");
					}
					else
					{
						LogTests.log ("funcVariable::this.myVar1:" + whoCalls,  null, "classMember");
						LogTests.log ("funcVariable::this.myVar2:" + whoCalls,  null, "classMember");
					}
				break;
				case "inFunc: ":
					//LogTests.log ("funcVariable,this:" + whoCalls,  String(this), "[object global]");
					if (this)
					{
						LogTests.log ("funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "null");
						LogTests.log ("funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "null");
					}
					else
					{
						LogTests.log ("funcVariable::this.myVar1:" + whoCalls,  null, "null");
						LogTests.log ("funcVariable::this.myVar2:" + whoCalls,  null, "null");
					}
					break;
				case "setTimeout :":
					//LogTests.log ("funcVariable,this:" + whoCalls,  String(this), "[object global]");
					if (this)
					{
						LogTests.log ("funcVariable::this.myVar1:" + whoCalls,  this.myVar1, "null");
						LogTests.log ("funcVariable::this.myVar2:" + whoCalls,  this.myVar2, "null");
					}
					else
					{
						LogTests.log ("funcVariable::this.myVar1:" + whoCalls,  null, "null");
						LogTests.log ("funcVariable::this.myVar2:" + whoCalls,  null, "null");
					}
					break;
			}

			LogTests.log ("funcVariable::myVar1:",  myVar1, "funcVariable");
			LogTests.log ("funcVariable::myVar2:",  myVar2, "memberFunc");
		}
		funcVariable("inFunc: ");
		funcRef = funcVariable;
		funcRef2 = myPrivateFunc;
		setTimeout(funcVariable, 100, "setTimeout :");
		setTimeout(this.myPrivateFunc, 200, "fromSTO :");
		setTimeout(this.myPublicFunc, 200, "fromSTO :");
	}

	private function myPrivateFunc(whoCalls:String = ""):void
	{
		//LogTests.log("myPrivateFunc,this:" + whoCalls,  String(this), "[object ScopeTest]");
		LogTests.log("myPrivateFunc::this.myVar1:" + whoCalls,  this.myVar1, "classMember");
		LogTests.log("myPrivateFunc::this.myVar2:" + whoCalls,  this.myVar2, "classMember");
		LogTests.log("myPrivateFunc::myVar1:" + whoCalls,  myVar1, "classMember");
		LogTests.log("myPrivateFunc::myVar2:" + whoCalls,  myVar2, "classMember");
	}
	public function myPublicFunc(whoCalls:String = ""):void
	{
		//LogTests.log("myPrivateFunc,this:" + whoCalls,  String(this), "[object ScopeTest]");
		LogTests.log("myPublicFunc::this.myVar1:" + whoCalls,  this.myVar1, "classMember");
		LogTests.log("myPublicFunc::this.myVar2:" + whoCalls,  this.myVar2, "classMember");
		LogTests.log("myPublicFunc::myVar1:" + whoCalls,  myVar1, "classMember");
		LogTests.log("myPublicFunc::myVar2:" + whoCalls,  myVar2, "classMember");
	}


}
}

import flash.utils.setTimeout;

class MySubClass{
	public function MySubClass(main:ScopeTest):void
	{
		main.funcRef("external");
		main.funcRef2();
		setTimeout(main.funcRef2, 400, "externalSTO:");
	}

}

class LogTests{
	public static var counter:int = 0;
	static function log(id:String, out:String, expected:String):void
	{
		counter++;
		var isPassed:Boolean = String(out) == expected;
		if (String(out) == "undefined" && expected == "null") isPassed = true;
		if (String(out) == "null" && expected == "undefined") isPassed = true;
		trace(counter + ":" +isPassed + ":\t\tid=" + id, "out=" + out, "expected=" + expected);
	}
}

const test = new ScopeTest();