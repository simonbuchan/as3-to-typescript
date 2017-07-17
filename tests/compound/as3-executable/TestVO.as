package
{
public class TestVO
{
	public function get func()		:Function {return _func }
	private var _func				:Function;

	public function get caption()	:String {   return _caption }
	private var _caption			:String

	public function get ref()		:String {   return _ref }
	private var _ref				:String;

	public function get expected()	:* {   return _expected }
	private var _expected			:*;


	public function get result()	:* {return _result }
	private var _result				:*;

	public function get isValid()	:Boolean {   return _isValid }
	private var _isValid			:Boolean;

	public var order

	public function TestVO(func:Function, caption:String, ref:String, expected:*, result:*)
	{
		_func = func;
		_caption = caption;
		_ref = ref;
		_expected = expected;
		_result = result;
		_isValid = expected === result;
	}
}
}
