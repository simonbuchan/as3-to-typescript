package
{
public class LoopImport
{
	public function LoopImport()
	{
		var array:Array = [1,2,3,4];
		for (var i:int = 0; i < array.length; i++)
		{
			trace(array[i]);
			var subClass:SubClass = new SubClass();
		}
	}
}
}
class SubClass{
	public function SubClass():void
	{

	}
}
