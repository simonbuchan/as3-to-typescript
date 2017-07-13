"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sprite_1 = require("./Sprite");
var View3D_1 = require("./View3D");
var Mesh_1 = require("./Mesh");
var StageScaleMode_1 = require("./StageScaleMode");
var StageAlign_1 = require("./StageAlign");
var PlaneGeometry_1 = require("./PlaneGeometry");
var TextureMaterial_1 = require("./TextureMaterial");
var Cast_1 = require("./Cast");
var Event_1 = require("./Event");
/*

 Basic View example in Away3d

 Demonstrates:

 How to create a 3D environment for your objects
 How to add a new textured object to your world
 How to rotate an object in your world

 Code by Rob Bateman
 rob@infiniteturtles.co.uk
 http://www.infiniteturtles.co.uk

 This code is distributed under the MIT License

 Copyright (c) The Away Foundation http://www.theawayfoundation.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the “Software”), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */
/*import away3d.containers.*;
*/
/*import away3d.entities.*;
*/
/*import away3d.materials.*;
*/
/*import away3d.primitives.*;
*/
/*import away3d.utils.*;
*/
/*import flash.display.*;
*/
/*import flash.events.*;
*/
var Vector3D_1 = require("../flash/geom/Vector3D");
/*[SWF(backgroundColor="#000000", frameRate="60", quality="LOW")]*/
var Basic_View = (function (_super) {
    __extends(Basic_View, _super);
    /**
     * Constructor
     */
    function Basic_View() {
        this.stage.scaleMode = StageScaleMode_1.StageScaleMode.NO_SCALE;
        this.stage.align = StageAlign_1.StageAlign.TOP_LEFT;
        //setup the view
        this._view = new View3D_1.View3D();
        this.addChild(this._view);
        //setup the camera
        this._view.camera.z = -600;
        this._view.camera.y = 500;
        this._view.camera.lookAt(new Vector3D_1.Vector3D());
        //setup the scene
        this._plane = new Mesh_1.Mesh(new PlaneGeometry_1.PlaneGeometry(700, 700), new TextureMaterial_1.TextureMaterial(Cast_1.Cast.bitmapTexture(Basic_View.FloorDiffuse)));
        this._view.scene.addChild(this._plane);
        //setup the render loop
        this.addEventListener(Event_1.Event.ENTER_FRAME, this._onEnterFrame);
        this.stage.addEventListener(Event_1.Event.RESIZE, this.onResize);
        this.onResize();
    }
    /**
     * render loop
     */
    Basic_View.prototype._onEnterFrame = function (e) {
        this._plane.rotationY += 1;
        this._view.render();
    };
    /**
     * stage listener for resize events
     */
    Basic_View.prototype.onResize = function (event) {
        if (event === void 0) { event = null; }
        this._view.width = this.stage.stageWidth;
        this._view.height = this.stage.stageHeight;
    };
    return Basic_View;
}(Sprite_1.Sprite));
exports.Basic_View = Basic_View;
