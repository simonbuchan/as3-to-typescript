package {

public class Being {
    public var name:String;
    private var _happiness:String;
    public function set happiness(value:String):void {
        doSetHappiness(value);
    }
    public function doSetHappiness(value:String):void {
        _happiness = value;
    }
    public function Being() {
        name = "abstract being";
        happiness = "low";
    }
    public function be():void {
        trace(name + " is - hapiness: " + _happiness);
    }
}

public class Animal extends Being {
    public function Animal() {
        super();
        name = "animal";
    }
    public function move():void {
        trace(name + ", an animal, moved");
        breathe();
    }
    protected function breathe():void {
        trace(name + ", an animal, breathed");
        be();
    }
}

public class Snake extends Animal {
    public function Snake() {
        super();
        name = "snake";
    }
    override public function set happiness(value:String):void {
        doSetHappiness("very " + value);
        breathe();
    }
    override public function move():void {
        happiness = "high";
        super.move();
    }
}

var sam:Snake = new Snake();
sam.move();

}
