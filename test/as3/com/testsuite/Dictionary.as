package
{
	import flash.utils.Dictionary;

	public class DictionaryTest
	{
		private var dict:Dictionary = new Dictionary();

		public function methodName(variable: *): void
		{
			var something: Btn_InfoDialog_DCEvnt = new Btn_InfoDialog_DCEvnt();
			delete dict[ variable[0] ];
			delete dict[ variable[ otherCall() ][ anotherCall() ] ];
			dict[ variable[0] ] = 4;
			dict[ variable[ otherCall() ][ anotherCall() ] ] = something[ 6 ];
		}

	}
}
