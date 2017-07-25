export class Callbacks {

    public a:string = "a"

    constructor(){

        this.callback(); // in ts: (class callback) this is: [object Object], a is: a
        this.executeCallback(this.callback); // in ts: (class callback) this is: undefined, a is: unknown
        this.executeCallback(function() { // in ts: (class callback) this is: undefined, a is: unknown
            console.log("(anonymous callback) this is: " + this);
            if(this) { console.log("a is: " + this.a) }
            else { console.log("a is: unknown") }
        });
    }

    private callback():void {
        console.log("(class callback) this is: " + this);
        if(this) { console.log("a is: " + this.a) }
        else { console.log("a is: unknown") }
    }

    private executeCallback(callback:Function):void {
        callback();
    }
}

new Callbacks()