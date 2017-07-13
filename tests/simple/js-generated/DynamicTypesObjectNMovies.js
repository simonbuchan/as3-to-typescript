/**
 * Created by Ushan on 30.06.2017.
 */
"use strict";
var MovieClip_1 = require("../flash/display/MovieClip");
var DynamicTypesObjectNMovies = (function () {
    function DynamicTypesObjectNMovies() {
        var myObject = {};
        myObject.a = 10;
        console.log(myObject.a);
        var myMovie = new MovieClip_1.MovieClip();
        myMovie.a = 10;
        console.log(myMovie.a);
    }
    return DynamicTypesObjectNMovies;
}());
exports.DynamicTypesObjectNMovies = DynamicTypesObjectNMovies;
