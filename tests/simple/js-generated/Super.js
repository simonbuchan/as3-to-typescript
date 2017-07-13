"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Being = (function () {
    function Being() {
        this.name = "abstract being";
        this.happiness = "low";
    }
    Object.defineProperty(Being.prototype, "happiness", {
        set: function (value) {
            this.doSetHappiness(value);
        },
        enumerable: true,
        configurable: true
    });
    Being.prototype.doSetHappiness = function (value) {
        this._happiness = value;
    };
    Being.prototype.be = function () {
        console.log(this.name + " is - hapiness: " + this._happiness);
    };
    return Being;
}());
exports.Being = Being;
var Animal = (function (_super) {
    __extends(Animal, _super);
    function Animal() {
        _super.call(this);
        this.name = "animal";
    }
    Animal.prototype.move = function () {
        console.log(this.name + ", an animal, moved");
        this.breathe();
    };
    Animal.prototype.breathe = function () {
        console.log(this.name + ", an animal, breathed");
        this.be();
    };
    return Animal;
}(Being));
exports.Animal = Animal;
var Snake = (function (_super) {
    __extends(Snake, _super);
    function Snake() {
        _super.call(this);
        this.name = "snake";
    }
    Object.defineProperty(Snake.prototype, "happiness", {
        /*override*/ set: function (value) {
            this.doSetHappiness("very " + value);
            this.breathe();
        },
        enumerable: true,
        configurable: true
    });
    /*override*/ Snake.prototype.move = function () {
        this.happiness = "high";
        _super.prototype.move.call(this);
    };
    return Snake;
}(Animal));
exports.Snake = Snake;
var sam = new Snake();
sam.move();
