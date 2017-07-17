package
{
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
}
