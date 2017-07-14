package {
public class SuperArray extends Array {

  public function SuperArray(...args) {
    super(args);

    var a:String = 'this should all be normal stuff';
    trace(a);

    /*
    Expects TS to insert the following when a class extends array:
    var thisAny:any=this;
     thisAny.__proto__ = SuperArray.prototype;
    * */
  }
}
}
