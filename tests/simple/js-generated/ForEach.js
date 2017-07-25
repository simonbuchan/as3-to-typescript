"use strict";
var ForEach = (function () {
    function ForEach() {
        // String array.
        var strings = [];
        strings.push('beer');
        strings.push('cats');
        strings.push('nature');
        for (var __$nflvKey in strings) {
            var str = strings[__$nflvKey];
            console.log("a string: " + str);
        }
        // for(var str1:String in strings) {
        //     trace("a string: " + str1);
        // }
        // Object array.
        // var objects:Vector.<AThing> = new Vector.<AThing>();
        // objects.push(new AThing("thing one"));
        // objects.push(new AThing("thing two"));
        // objects.push(new AThing("thing three"));
        // for each(var obj:AThing in objects) {
        //     trace("a thing: " + obj.name);
        // }
        // var a:Vector.<int> = Vector.<int>([1, 2, 3]);
        // var b:Vector.<int> = Vector.<int>([1, 2, 3, 4]);
        // for each(var iVec:Vector.<int> in [a, b]) {
        //     trace("> " + iVec);
        // }
    }
    return ForEach;
}());
exports.ForEach = ForEach;
// public class AThing {
//     public var name:String = "";
//     public function AThing(name:String) {
//         trace("hello. Im a thing.");
//         this.name = name;
//     }
// }
new ForEach();
