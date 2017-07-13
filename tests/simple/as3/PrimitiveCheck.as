package {
public class PrimitiveCheck {

  public function PrimitiveCheck() {

    var myVar;
    if(myVar is int)     { trace("it's a number"); }
    if(myVar is String)  { trace("it's a string"); }
    if(myVar is Boolean) { trace("it's a boolean"); }
    if(myVar is Object)  { trace("it's an object"); }

    /*
    Expected TS:
     if(typeof myVar === "number") { console.log("it's a number"); }
     if(typeof myVar === 'string') { console.log("it's a string"); }
     if(typeof myVar === 'boolean')   { console.log("it's a boolean"); }
    */
  }
}
}
