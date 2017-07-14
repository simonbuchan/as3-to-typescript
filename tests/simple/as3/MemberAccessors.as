package {
public class Accessors {

    public var memberVar:String = "hello";

    public function Accessors() {
        memberMethod();
    }

    public function memberMethod():void {
        trace(memberVar);

        var a:String = "a";
        var b:String = "b";

        var c:Function = function() {
            trace("hello! I am here to make your life more complicated =D");
        }
    }
}
}
