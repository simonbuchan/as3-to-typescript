package
{
public class InterfaceTest
{
	public function InterfaceTest()
	{
		var myClass:MyClass = new MyClass();
		trace(myClass.myFunc(1));
	}
}
}

interface myInterface{
	function myFunc(value:Number):Number
}

class MyClass implements myInterface{
	public function myFunc(value:Number):Number
	{
		return 10
	}
}