import { TestVO } from "./TestVO";
import { MappedClass } from "./MappedClass";

export class LoopTestsAbstracts
{
    public tests:any[] = [];
    public valueNoType = 100;
    public valueProp:number = 200;
    public keyVariable = "e";
    constructor(){
        this.forEach1Simple();
        this.forEach2VarPredefined();
        this.forEach2NoDeclaration();
        this.forEach2VarIsProperty();
        this.forEach2VarIsPropertyTyped();
        this.forEach3ClassMapped();
        this.forEach4ClassMappedVarPredefined();
        this.forEach5Array();
//		forEach6Vector();
//		forEach6VectorVarPredefined();
        this.for7Array();
        this.for8Array();
        this.for9Array();
        this.forIn10ArrayString();
        this.forIn11ArrayUntyped();
        this.forIn12Object();
        this.forIn13ObjectTyped();
        this.forIn14ObjectTypedVarPredefined();
        this.forIn14KeyIsProperty();
//		forIn15VectorString();
//		forIn16VectorVarPredefined();
//		forIn17VectorUntyped();

        this.forEach3ClassMapped_noSemi();

        for (var i:number = 0; i < this.tests.length; i++)
        {
            var testVO:TestVO = this.tests[i];
            console.log(testVO.caption + "\t\t", testVO.isValid + "\t\t", " expected:" + testVO.expected, " result:" + testVO.result, testVO.ref);

        }
    }

    public forEach1Simple():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        for  (var __$nflvKey in myObj)
        {
			var value = myObj[__$nflvKey];

            sum += value;

        }

        var testVO:TestVO = new TestVO(this.forEach1Simple, "forEach1Simple", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach2VarPredefined():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var value;
        for  (var __$nflvKey  in myObj)
        {
			value = myObj[__$nflvKey];

            sum += value;
        }

        var testVO:TestVO = new TestVO(this.forEach2VarPredefined, "forEach2VarPredefined", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach2NoDeclaration():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var value = 300;
        var maxValue = 0; //for ignoring order
        for  (var __$nflvKey  in myObj)
        {
			value = myObj[__$nflvKey];

            sum += value;
            if (value > maxValue)maxValue = value;
        }
        sum += maxValue;
        var testVO:TestVO = new TestVO(this.forEach2NoDeclaration, "forEach2NoDeclaration", ref, 14, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach2VarIsProperty():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var maxValue = 0; //for ignoring order
        for  (var __$nflvKey  in myObj)
        {
			this.valueNoType = myObj[__$nflvKey];

            sum += this.valueNoType;
            if (this.valueNoType > maxValue)maxValue = this.valueNoType;
        }
        sum += maxValue;
        var testVO:TestVO = new TestVO(this.forEach2VarIsProperty, "forEach2VarIsProperty", ref, 14, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach2VarIsPropertyTyped():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var maxValue = 0; //for ignoring order
        for  (var __$nflvKey  in myObj)
        {
			this.valueProp = myObj[__$nflvKey];

            sum += this.valueProp;
            if (this.valueProp > maxValue)maxValue = this.valueProp;
        }
        sum += maxValue;
        var testVO:TestVO = new TestVO(this.forEach2VarIsPropertyTyped, "forEach2VarIsPropertyTyped", ref, 14, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach3ClassMapped():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {};
        var a:MappedClass = new MappedClass(1);
        myObj.a = a;
        var b:MappedClass = new MappedClass(2);
        myObj.b = b;
        var c:MappedClass = new MappedClass(3);
        myObj.c = c;
        var d:MappedClass = new MappedClass(4);
        myObj.d = d;
        var sum:number = 0;
        for  (var __$nflvKey  in myObj)
        {
			var value:MappedClass = myObj[__$nflvKey];

            sum += value.variable;
        }

        var testVO:TestVO = new TestVO(this.forEach3ClassMapped, "forEach3ClassMapped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach4ClassMappedVarPredefined():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {};
        var a:MappedClass = new MappedClass(1);
        myObj.a = a;
        var b:MappedClass = new MappedClass(2);
        myObj.b = b;
        var c:MappedClass = new MappedClass(3);
        myObj.c = c;
        var d:MappedClass = new MappedClass(4);
        myObj.d = d;
        var sum:number = 0;
        var value:MappedClass
        for  (var __$nflvKey  in myObj)
        {
			value = myObj[__$nflvKey];

            sum += value.variable;
        }

        var testVO:TestVO = new TestVO(this.forEach4ClassMappedVarPredefined, "forEach4ClassMappedVarPredefined", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forEach5Array():boolean
    {
        var ref:string = "https://github.com/awaystudios/sunflower-ts/tree/master/tests/full-as3/srcMain/main/MenuBar.as#L231";
        var array:any[] = [1,2,3,4];
        var i:number;
        var sum:number = 0;
        for  (var __$nflvKey  in array)
        {
			i = array[__$nflvKey];

            sum += i;
        }
        var testVO:TestVO = new TestVO(this.forEach5Array, "forEach5Array", ref, 10, sum);
        this.tests.push(testVO);
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

    public for7Array():boolean
    {
        var ref:string = "http://noRef";
        var array:any[] = [1,2,3,4];
        var i:number;
        var sum:number = 0;
        for (var i:number = 0; i < array.length; i++)
        {
            sum += array[i];
        }
        var testVO:TestVO = new TestVO(this.for7Array, "for7Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public for8Array():boolean
    {
        var ref:string = "http://noRef";
        var array:any[] = [1,2,3,4];
        var i:number;
        var sum:number = 0;
        var i:number;
        for (i = 0; i < array.length; i++)
        {
            sum += array[i];
        }
        var testVO:TestVO = new TestVO(this.for8Array, "for8Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }



    public for9Array():boolean
    {
        var ref:string = "http://noRef";
        var array:any[] = [1,2,3,4];
        var sum:number = 0;
        var i:number;
        for (i = 0; i < array.length; i++)
        {
            sum += array[i];
        }
        var testVO:TestVO = new TestVO(this.for9Array, "for9Array", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forIn10ArrayString():boolean
    {
        var ref:string = "http://noRef";
        var array:any[] = [1,2,3,4];
        var sum:number = 0;
        var v:string;
for (v  in array)
        {
            sum += array[v];
        }
        var testVO:TestVO = new TestVO(this.forIn10ArrayString, "forIn10ArrayString", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forIn11ArrayUntyped():boolean
    {
        var ref:string = "http://noRef";
        var array:any[] = [1,2,3,4];
        var sum:number = 0;
        var v;
for (v in array)
        {
            sum += array[v];
        }
        var testVO:TestVO = new TestVO(this.forIn11ArrayUntyped, "forIn11ArrayUntyped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forIn12Object():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var key;
for (key in myObj)
        {
            sum += myObj[key];

        }

        var testVO:TestVO = new TestVO(this.forIn12Object, "forIn12Object", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forIn13ObjectTyped():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var key:string;
for (key  in myObj)
        {
            sum += myObj[key];

        }

        var testVO:TestVO = new TestVO(this.forIn13ObjectTyped, "forIn13ObjectTyped", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forIn14ObjectTypedVarPredefined():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var key:string;
        for (key  in myObj)
        {
            sum += myObj[key];

        }

        var testVO:TestVO = new TestVO(this.forIn14ObjectTypedVarPredefined, "forIn14ObjectTypedVarPredefined", ref, 10, sum);
        this.tests.push(testVO);
        return testVO.isValid
    }

    public forIn14KeyIsProperty():boolean
    {
        var ref:string = "http://noRef";
        var myObj:any = {a:1, b:2, c:3, d:4};
        var sum:number = 0;
        var maxValue = 0; //for ignoring order in last iterated key
        for (this.keyVariable  in myObj)
        {
            sum += myObj[this.keyVariable];
        }
        if (this.keyVariable == "d")sum = 1000;

        var testVO:TestVO = new TestVO(this.forIn14KeyIsProperty, "forIn14KeyIsProperty", ref, 10, sum);
        this.tests.push(testVO);
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

    public forEach3ClassMapped_noSemi():boolean
    {
        var ref:string = "http://noRef"
        var myObj:any = {}
        var a:MappedClass = new MappedClass(1)
        myObj.a = a
        var b:MappedClass = new MappedClass(2)
        myObj.b = b
        var c:MappedClass = new MappedClass(3)
        myObj.c = c
        var d:MappedClass = new MappedClass(4)
        myObj.d = d
        var sum:number = 0
        for  (var __$nflvKey  in myObj)
        {
			var value:MappedClass = myObj[__$nflvKey];

            sum += value.variable
        }

        var testVO:TestVO = new TestVO(this.forEach3ClassMapped, "forEach3ClassMapped", ref, 10, sum)
        this.tests.push(testVO)
        return testVO.isValid
    }


}



class TestVO
{
    public get func()		:Function {return this._func }
    private _func				:Function;

    public get caption()	:string {   return this._caption }
    private _caption			:string

    public get ref()		:string {   return this._ref }
    private _ref				:string;

    public get expected()	:any {   return this._expected }
    private _expected			:any;


    public get result()	:any {return this._result }
    private _result				:any;

    public get isValid()	:boolean {   return this._isValid }
    private _isValid			:boolean;

    public order

    constructor(func:Function, caption:string, ref:string, expected:any, result:any){
        this._func = func;
        this._caption = caption;
        this._ref = ref;
        this._expected = expected;
        this._result = result;
        this._isValid = expected === result;
    }
}

class MappedClass
{
    public variable:number;
    constructor(variable:number)
    {
        this.variable = variable;
    }

    public toString():string
    {
        return String(this.variable);
    }
}
const loop = new LoopTestsAbstracts()