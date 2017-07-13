package {
public class Casting {

    public function Casting() {

        var v0:String = "HEY";
        thisMethodIsInTheClassScope(v0.toLowerCase());

        var v1:Array = [1, 2, 3];
        var v2:String = String(v1[2]);
        var v3:String = String(v1[2].toUpperCase());

        thisMethodIsInTheClassScope("hey");

        var nowThisIsTricky:uint = uint(v1[3]);

        var v4:int = Math.round(int("5"));
        var v4:int = Math.round(5.2);

        var v5:Vector.<Number> = Vector.<Number>([1, 2, 3, 4]);

        trace("lets cast");

        var str:String = "5";
        var num:int = 1;
        trace("str: " + str + ", num: " + num);

        // String -> Num
        num = int(str) + 1;
        trace("str: " + str + ", num: " + num);

        // Num -> String
        str = String(num + 1);
        trace("str: " + str + ", num: " + num);

    }

    private function thisMethodIsInTheClassScope(str:String) {
        trace(str);
    }
}
}
new Casting();