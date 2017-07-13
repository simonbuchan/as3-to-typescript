package {
public class Callbacks {

    public var a:String = "a"

    public function Callbacks() {

        callback(); // in ts: (class callback) this is: [object Object], a is: a
        executeCallback(callback); // in ts: (class callback) this is: undefined, a is: unknown
        executeCallback(function() { // in ts: (class callback) this is: undefined, a is: unknown
            trace("(anonymous callback) this is: " + this);
            if(this) { trace("a is: " + a) }
            else { trace("a is: unknown") }
        });
    }

    private function callback():void {
        trace("(class callback) this is: " + this);
        if(this) { trace("a is: " + a) }
        else { trace("a is: unknown") }
    }

    private function executeCallback(callback:Function):void {
        callback();
    }
}
}
new Callbacks();