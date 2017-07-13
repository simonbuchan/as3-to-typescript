/**
 * Created by palebluedot on 5/3/17.
 */
package {
public class Unreachable {
    public function Unreachable() {
        demonstrate();
    }
    public function demonstrate():int {

        var tPow:int = 1;
        var tExp:int = 1;
        var tNum:int = 1;
        var tAverage:int = 1;
        var tFactorial:int = 1;
        var tRandom:int = 1;

        // more stuff in function here
        while (true)
        {
            var tP:Number = tPow * tExp / tFactorial;
            if (tRandom < tP)
            {
                return tNum
            }
            tRandom -= tP;
            tNum++;
            tFactorial *= tNum;
            tPow *= tAverage
        }
//        return 0 // just for the compiler
    }
}
}
