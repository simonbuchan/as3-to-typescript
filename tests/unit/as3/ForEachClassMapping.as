package
{
public class ForEachClassMapping
{
	public function ForEachClassMapping()
	{
		var myObj:Object = {};
		var a:MappedClass = new MappedClass("a");
		myObj.a = a;
		var b:MappedClass = new MappedClass("b");
		myObj.b = b;
		var c:MappedClass = new MappedClass("c");
		myObj.c = c;
		for each (var value:MappedClass in myObj)
		{
			trace(value);
		}
	}
}
}


class MappedClass
{
	public var value:String;
	public function MappedClass(value):void
	{
		this.value = value;
	}

	public function toString():String
	{
		return value;
	}
}
