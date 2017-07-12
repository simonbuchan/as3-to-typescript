import { IDoer } from "./IDoer";
/**
 * Created by palebluedot on 3/24/17.
 */
export class Thing implements IDoer {

    private aFunction:Function = function(param1:number, param2:string):boolean {
        return false;
    };

    constructor(){


    }

    public doSomething():void {
        // this looks like a comment, but it isn't.
    }

    private thisIsASuperSecretMethod(name:string, defaultVal:any = null):void {

    }

    private addSubDoer(doer:IDoer):void {

    }
}

