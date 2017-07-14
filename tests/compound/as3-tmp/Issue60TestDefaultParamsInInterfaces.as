package
{
public class Issue60TestDefaultParamsInInterfaces
{
	public function Issue60TestDefaultParamsInInterfaces()
	{
		var myClass:MyClass = new MyClass();
		var sum:Number = myClass.myFunction();
	}


}
}

class MyClass implements MyInterface{
	public function myFunction(var1:Number = 7, var2:String = "13", var3:uint = 17):Number
	{
		return var1 + parseInt(var2) + var3
	}
}
interface MyInterface {
	function myFunction(var1:Number = 7, var2:String = "13", var3:uint = 17):Number

}