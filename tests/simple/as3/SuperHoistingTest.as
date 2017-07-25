package
{
public class SuperHoistingTest extends MyClass
{
	public function SuperHoistingTest()
	{

	}

	override protected function myFunc(value:Number):Number
	{
		return super.myFunc(value) * 3;
	}

	override public function get myProp()        :Number {return super.myProp * 5}
	override public function set myProp(value    :Number ):void {super.myProp / 5}
}
}

class MyClass{
	protected var myVar:Number = 7;
	protected var myVar2:Number;

	public function get myProp()        :Number {return _myProp }
	public function set myProp(value    :Number ):void {_myProp = value;}
	private var _myProp                 :Number = 5;


	public function MyClass():void
	{
		myVar2 = 13;
	}
	protected function myFunc(value:Number):Number
	{
		return value * 10;
	}
}
