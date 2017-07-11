package
{
public class LoopTestsAbstracts
{
    public var tests:Array = [];
    public var valueNoType = 100;
    public var valueProp:int = 200;
    public var keyVariable = "e";
    public function LoopTestsAbstracts()
    {
        forEach1Simple();
        forEach2VarPredefined();
        forEach2NoDeclaration();
        forEach2VarIsProperty();
        forEach2VarIsPropertyTyped();
        forEach3ClassMapped();
        forEach4ClassMappedVarPredefined();
        forEach5Array();
//		forEach6Vector();
//		forEach6VectorVarPredefined();
        for7Array();
        for8Array();
        for9Array();
        forIn10ArrayString();
        forIn11ArrayUntyped();
        forIn12Object();
        forIn13ObjectTyped();
        forIn14ObjectTypedVarPredefined();
        forIn14KeyIsProperty();
//		forIn15VectorString();
//		forIn16VectorVarPredefined();
//		forIn17VectorUntyped();

        forEach3ClassMapped_noSemi();

        for (var i:int = 0; i < tests.length; i++)
        {
            var testVO:TestVO = tests[i];
            trace(testVO.caption + "\t\t", testVO.isValid + "\t\t", " expected:" + testVO.expected, " result:" + testVO.result, testVO.ref);

        }
    }

    public function forEach1Simple():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        for each (var value in myObj)
        {
            sum += value;

        }

        var testVO:TestVO = new TestVO(forEach1Simple, "forEach1Simple", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach2VarPredefined():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        var value;
        for each (value in myObj)
        {
            sum += value;
        }

        var testVO:TestVO = new TestVO(forEach2VarPredefined, "forEach2VarPredefined", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach2NoDeclaration():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        var value = 300;
        var maxValue = 0; //for ignoring order
        for each (value in myObj)
        {
            sum += value;
            if (value > maxValue)maxValue = value;
        }
        sum += maxValue;
        var testVO:TestVO = new TestVO(forEach2NoDeclaration, "forEach2NoDeclaration", ref, 14, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach2VarIsProperty():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        var maxValue = 0; //for ignoring order
        for each (valueNoType in myObj)
        {
            sum += valueNoType;
            if (valueNoType > maxValue)maxValue = valueNoType;
        }
        sum += maxValue;
        var testVO:TestVO = new TestVO(forEach2VarIsProperty, "forEach2VarIsProperty", ref, 14, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach2VarIsPropertyTyped():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        var maxValue = 0; //for ignoring order
        for each (valueProp in myObj)
        {
            sum += valueProp;
            if (valueProp > maxValue)maxValue = valueProp;
        }
        sum += maxValue;
        var testVO:TestVO = new TestVO(forEach2VarIsPropertyTyped, "forEach2VarIsPropertyTyped", ref, 14, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach3ClassMapped():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {};
        var a:MappedClass = new MappedClass(1);
        myObj.a = a;
        var b:MappedClass = new MappedClass(2);
        myObj.b = b;
        var c:MappedClass = new MappedClass(3);
        myObj.c = c;
        var d:MappedClass = new MappedClass(4);
        myObj.d = d;
        var sum:Number = 0;
        for each (var value:MappedClass in myObj)
        {
            sum += value.variable;
        }

        var testVO:TestVO = new TestVO(forEach3ClassMapped, "forEach3ClassMapped", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach4ClassMappedVarPredefined():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {};
        var a:MappedClass = new MappedClass(1);
        myObj.a = a;
        var b:MappedClass = new MappedClass(2);
        myObj.b = b;
        var c:MappedClass = new MappedClass(3);
        myObj.c = c;
        var d:MappedClass = new MappedClass(4);
        myObj.d = d;
        var sum:Number = 0;
        var value:MappedClass
        for each (value in myObj)
        {
            sum += value.variable;
        }

        var testVO:TestVO = new TestVO(forEach4ClassMappedVarPredefined, "forEach4ClassMappedVarPredefined", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forEach5Array():Boolean
    {
        var ref:String = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
        var array:Array = [1,2,3,4];
        var i:int;
        var sum:Number = 0;
        for each (i in array)
        {
            sum += i;
        }
        var testVO:TestVO = new TestVO(forEach5Array, "forEach5Array", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    /*	public function forEach6Vector():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var sum:Number = 0;
     for each (var i:int in vec)
     {
     sum += i;
     }
     var testVO:TestVO = new TestVO(forEach6Vector, "forEach6Vector", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/

    /*	public function forEach6VectorVarPredefined():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var i:int;
     var sum:Number = 0;
     for each (i in vec)
     {
     sum += i;
     }
     var testVO:TestVO = new TestVO(forEach6Vector, "forEach6Vector", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/

    public function for7Array():Boolean
    {
        var ref:String = "http://noRef";
        var array:Array = [1,2,3,4];
        var i:int;
        var sum:Number = 0;
        for (var i:int = 0; i < array.length; i++)
        {
            sum += array[i];
        }
        var testVO:TestVO = new TestVO(for7Array, "for7Array", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function for8Array():Boolean
    {
        var ref:String = "http://noRef";
        var array:Array = [1,2,3,4];
        var i:int;
        var sum:Number = 0;
        var i:int;
        for (i = 0; i < array.length; i++)
        {
            sum += array[i];
        }
        var testVO:TestVO = new TestVO(for8Array, "for8Array", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }



    public function for9Array():Boolean
    {
        var ref:String = "http://noRef";
        var array:Array = [1,2,3,4];
        var sum:Number = 0;
        var i:int;
        for (i = 0; i < array.length; i++)
        {
            sum += array[i];
        }
        var testVO:TestVO = new TestVO(for9Array, "for9Array", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forIn10ArrayString():Boolean
    {
        var ref:String = "http://noRef";
        var array:Array = [1,2,3,4];
        var sum:Number = 0;
        for (var v:String in array)
        {
            sum += array[v];
        }
        var testVO:TestVO = new TestVO(forIn10ArrayString, "forIn10ArrayString", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forIn11ArrayUntyped():Boolean
    {
        var ref:String = "http://noRef";
        var array:Array = [1,2,3,4];
        var sum:Number = 0;
        for (var v in array)
        {
            sum += array[v];
        }
        var testVO:TestVO = new TestVO(forIn11ArrayUntyped, "forIn11ArrayUntyped", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forIn12Object():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        for (var key in myObj)
        {
            sum += myObj[key];

        }

        var testVO:TestVO = new TestVO(forIn12Object, "forIn12Object", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forIn13ObjectTyped():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        for (var key:String in myObj)
        {
            sum += myObj[key];

        }

        var testVO:TestVO = new TestVO(forIn13ObjectTyped, "forIn13ObjectTyped", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forIn14ObjectTypedVarPredefined():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        var key:String;
        for (key in myObj)
        {
            sum += myObj[key];

        }

        var testVO:TestVO = new TestVO(forIn14ObjectTypedVarPredefined, "forIn14ObjectTypedVarPredefined", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    public function forIn14KeyIsProperty():Boolean
    {
        var ref:String = "http://noRef";
        var myObj:Object = {a:1, b:2, c:3, d:4};
        var sum:Number = 0;
        var maxValue = 0; //for ignoring order in last iterated key
        for (keyVariable in myObj)
        {
            sum += myObj[keyVariable];
        }
        if (keyVariable == "d")sum = 1000;

        var testVO:TestVO = new TestVO(forIn14KeyIsProperty, "forIn14KeyIsProperty", ref, 10, sum);
        tests.push(testVO);
        return testVO.isValid
    }

    /*	public function forIn15VectorString():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var sum:Number = 0;
     for (var key:String in vec)
     {
     sum += vec[key];
     }
     var testVO:TestVO = new TestVO(forIn15VectorString, "forIn15VectorString", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/

    /*	public function forIn16VectorVarPredefined():Boolean
     {
     var ref:String = "http://noRef"
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var key:int;
     var sum:Number = 0;
     for (key in vec)
     {
     sum += vec[key];
     }
     var testVO:TestVO = new TestVO(forIn16VectorVarPredefined, "forIn16VectorVarPredefined", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/

    /*	public function forIn17VectorUntyped():Boolean
     {
     var ref:String = "http://noRef";
     var vec:Vector.<int> = new <int>[1,2,3,4];
     var sum:Number = 0;
     for (var key in vec)
     {
     sum += vec[key];
     }
     var testVO:TestVO = new TestVO(forIn17VectorUntyped, "forIn17VectorUntyped", ref, 10, sum);
     tests.push(testVO);
     return testVO.isValid
     }*/

    public function forEach3ClassMapped_noSemi():Boolean
    {
        var ref:String = "http://noRef"
        var myObj:Object = {}
        var a:MappedClass = new MappedClass(1)
        myObj.a = a
        var b:MappedClass = new MappedClass(2)
        myObj.b = b
        var c:MappedClass = new MappedClass(3)
        myObj.c = c
        var d:MappedClass = new MappedClass(4)
        myObj.d = d
        var sum:Number = 0
        for each (var value:MappedClass in myObj)
        {
            sum += value.variable
        }

        var testVO:TestVO = new TestVO(forEach3ClassMapped, "forEach3ClassMapped", ref, 10, sum)
        tests.push(testVO)
        return testVO.isValid
    }


}
}


class TestVO
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

class MappedClass
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
const loop = new LoopTestsAbstracts();