package
{
public class LogTests{
	public static var counter:int = 0;
	static function log(verbose:int, id:String, out:String, expected:*):void
	{
		counter++;
		var isPassed:Boolean;
		var areEqual:Boolean;
		if (expected is Array)
		{
			isPassed =  expected.indexOf(String(out)) >= 0;
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
}
