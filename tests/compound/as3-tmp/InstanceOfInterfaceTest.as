package
{
public class InstanceOfInterfaceTest
{
	public function InstanceOfInterfaceTest()
	{
		var ins1:MyClass = new MyClass();
		var ins2:MyClass = new MySubClass();
		var ins3:MyClass = new MySubSubClass();
		var ins4:MySubClass = new MySubClass();
		var ins5:MySubClass = new MySubSubClass();
		var ins6:MySubSubClass = new MySubSubClass();

		var resultA1:Boolean = ins1 is SimpleInterface;
		var resultA2:Boolean = ins2 is SimpleInterface;
		var resultA3:Boolean = ins3 is SimpleInterface;
		var resultA4:Boolean = ins4 is SimpleInterface;
		var resultA5:Boolean = ins5 is SimpleInterface;
		var resultA6:Boolean = ins6 is SimpleInterface;
		var resultB1:Boolean = ins1 is SimpleInterface2;
		var resultB2:Boolean = ins2 is SimpleInterface2;
		var resultB3:Boolean = ins3 is SimpleInterface2;
		var resultB4:Boolean = ins4 is SimpleInterface2;
		var resultB5:Boolean = ins5 is SimpleInterface2;
		var resultB6:Boolean = ins6 is SimpleInterface2;


		var result:String = Number(resultA1) + "/" + Number(resultA2) + "/" +  Number(resultA3) + "/" +  Number(resultA3) + "/" +  Number(resultA4) + "/" +  Number(resultA5) + "/" +  Number(resultA6) + "/" +
				+ Number(resultB1) + "/" + Number(resultB2) + "/" +  Number(resultB3) + "/" +  Number(resultB3) + "/" +  Number(resultB4) + "/" +  Number(resultB5) + "/" +  Number(resultB6);
		trace(result == "1/1/1/1/1/1/1/0/0/1/1/0/1/1", "expected:" + "1/1/1/1/1/1/1/0/0/1/1/0/1/1", "result " + result);
	}
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

class MySubSubClass extends MySubClass  implements SimpleInterface2{

}

const test = new InstanceOfInterfaceTest();