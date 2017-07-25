package
{
public class MappedClass
{
	public var variable:int;
	public function MappedClass(variable:int):void
	{
		this.variable = variable;
	}

	public function toString():String
	{
		return String(variable);
	}
}
}
