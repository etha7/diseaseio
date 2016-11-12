(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

//Utility functions:------------------------------------------------

//Utility function for comparing arrays for equality
Array.prototype.equals = function( array ) {
  return this.length == array.length && 
           this.every( function(this_i,i) { return this_i == array[i] } )  
}


//Utility functions:^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


//Class definitions:------------------------------------------------

//Base class for all primitive objects that get drawn
function EaselObject( pos, color){

   this.easelShape = new createjs.Shape();
   this.getEaselShape = function(){ return this.easelShape; };

   //Set initial position
   this.easelShape.x = pos.x;
   this.easelShape.y = pos.y;

   //Position setters and getters
   this.getPos = function() { return {x: this.getEaselShape().x, y: this.getEaselShape().y}; };
   this.setPos = function(pos) { this.getEaselShape().x = pos.x; this.getEaselShape().y = pos.y;};

   //The object's color
   this.color = color;

   //Adds the current object to the stage
   this.add = function(stage) {
      stage.addChild(this.getEaselShape());
      stage.update();
   };

   //Removes the current object from the stage
   this.remove = function(stage) {
      stage.removeChild(this.getEaselShape());
   };
}

//A class for representing circles
function Circle(pos, color, radius ){
   //Call constructor of superclass
   EaselObject.call(this, pos, color);  

   //Set the new radius
   this.radius = radius;

   //Function: draw a circle
   this.draw = function(){
      this.easelShape.graphics.clear();
      this.easelShape.graphics.beginFill(this.color).drawCircle(0,0,this.radius);
   }

   //Function: draw a dotted circle
   this.drawDotted = function(){
      this.easelShape.graphics.clear();

      //20 pixel lines with 5 pixel gaps
      //this.easelShape.graphics.setStrokeDash([20,5]);
      this.easelShape.graphics.setStrokeStyle(2).beginStroke(this.color).drawCircle(0,0,this.radius);
   }
    
   this.draw();
}

function Rectangle(pos, color, width, height){
   EaselObject.call(this, pos, color);

   this.width  = width;
   this.height = height;


   //Easel.js draws rectangles using coordinates representing the rectangle's upper left corner
   //The position offsets here draw the rectangle such that pos represents the center if it. 
   this.easelShape.x -=  this.width/2
   this.easelShape.y -=  this.height/2
   
   //Draw the rectangle
   this.draw = function(){
      this.easelShape.graphics.clear();
      this.getEaselShape().graphics.beginFill(this.color).drawRect(0, 0, this.width, this.height);
   }
   this.draw();

}

function Resource(value){
   Circle.call(this, {x: 0, y: 0}, "white", 10);
   this.value = value;
}

function DiseaseZone(playerPos){
   Circle.call(this, playerPos, "red", 75);
   this.drawDotted();
   this.AllowsTeams = false;

   //Inverts whether the diseaseZone allows teams
   //TODO make property of player
   this.invertAllowsTeams = function(){

     //Set to not allow teams
     if(this.AllowsTeams === true){
        this.color = "red";
        this.drawDotted();
     }
     else
     {
        this.color = "green";
        this.drawDotted();
     }
     this.AllowsTeams = !this.AllowsTeams;
   };
   
}

function Camera(pos, width, height){
   this.pos = pos;
   this.width = width;
   this.height = height;
   this.getPos = function(){return this.pos;};
   this.setPos = function(pos) {this.pos = pos;};
   this.getWidth = function(){return this.width;};
   this.setWidth = function(width) {this.width = width;};
   this.getHeight = function(){return this.height;};
   this.setHeight = function(height) {this.height = height;};
}

function Player(pos){
   Circle.call( this, pos, "red", 20);
    //{x: canvas.width/2, y: canvas.height/2}, "red", 20);
   

   this.id;
   this.diseaseZone = new DiseaseZone(this.getPos());
   this.resources = 0;
   this.camera = {};
   this.path = [];

   //this.getCamera = function(){ return this.camera;};
   //this.setCamera = function(camera){ this.camera = camera; };
   
   //Moves the player along a path determined by A* algorithm
   this.goPath = function(deltaTime){
      
      if(this.path.equals([]) === false)
      {
         var pos = {x: this.path[0].x, y: this.path[0].y};
         this.setPos(pos);
         this.path.splice(0, 1*deltaTime); //Remove deltaTime elements starting from 
                                //element 0;
         return pos;
      }
     var pos = {x: this.getPos().x, y: this.getPos().y}; 
      return pos;
   }

   this.getResources = function(){ return this.resources;};
   this.setResources = function(newResources){ this.resources = newResources};

   //Override inherited setPos
   var parentSetPos = this.setPos;
   this.setPos = function(pos){ 
       //this.camera.setPos(pos);
       this.diseaseZone.setPos(pos);
       parentSetPos.call(this, pos); //need call so 'this' is defined as the current Player
   };
   this.setPos(pos);

   //Override inherited add
   var parentAdd = this.add;
   this.add = function(stage){
      this.diseaseZone.add(stage);
      parentAdd.call(this, stage);
   }

   var parentRemove = this.remove;
   this.remove = function(stage){
      this.diseaseZone.remove(stage);
      parentRemove.call(this, stage);
   }
      
   //Check if standing on any resources
   this.pickup = function(stage, resources){
      var easelShape = this.getEaselShape();
      var resourceCopy = resources.slice(0,resources.length);
      //for (var x of resourceCopy){
      for( i = 0; i < resourceCopy.length; i++){
         var x = resourceCopy[i]; //current resource

         var pos = x.getPos();
         var pt =  easelShape.globalToLocal(pos.x, pos.y); //hitTest needs coordinates relative to easelShape
         if(easelShape.hitTest(pt.x, pt.y)) //If player is over resource
         {
            this.setResources(this.getResources() + x.value);
            var remIndex = resources.indexOf(x);
            resources.splice(remIndex,1);
            x.remove(stage);
         }
      }
   }
}

//Controls ---------------------------------------------------------

//Creates a Joystick at the given location
function Joystick(pos, player){

   this.pos = pos;
   this.player = player;

   this.baseSize = 35;
   this.baseColor = "grey";
   this.base = new Circle(this.pos, this.baseColor, this.baseSize);

   this.stickSize = 25;
   this.stickColor = "white";
   this.stick =  new Circle(this.pos, this.stickColor, this.stickSize);

   //Limited Dragging
   this.stick.getEaselShape().on("pressmove", function(e){
      e.target.x = e.stageX; //(stageX, stageY) = mouseCoordinate
      e.target.y = e.stageY;
   });
   
   var baseVar = this.base; //No idea why I have to do this; scoping?
   //Reset stick to base potition on when joystick is released
   this.stick.getEaselShape().on("pressup", function(e){
      e.target.x = baseVar.getPos().x;  
      e.target.y = baseVar.getPos().y;
   });
   
   this.getPos = function() { return this.base.getPos()};
   this.setPos = function(pos) {
      this.base.setPos(pos);
      this.stick.setPos(pos);
   }

   //Get the direction the joystick is pointing
   this.getDirection = function(){
      var v = this.stick.getPos();
      var w = this.base.getPos();
      var x1 = v.x - w.x; //new coordinates
      var y1 = v.y - w.y;
      var mag1 = Math.sqrt(x1*x1 + y1*y1);

      return {x: x1/mag1, y: y1/mag1}
   };

   //Get the force acting on a player by the joystick
   this.getForce = function(){
      var v = this.stick.getPos();
      var w = this.base.getPos();
      return Math.abs(Math.sqrt(v.x*v.x + v.y*v.y) - Math.sqrt(w.x*w.x + w.y*w.y));
   };


   //Update player's location with respect to joystick
   this.move = function (delta) { //Delta is deltaTime

      //Move player with left joystick
      var playerPos = this.player.getPos();
      var direction = this.getDirection();

      //TODO make damping player property
      var damping = 1/20;
      if(isNaN(direction.x) || isNaN(direction.y))
      {
         direction.x = 0;
         direction.y = 0;
      }
      playerPos.x += damping*delta*this.getForce()*direction.x;
      playerPos.y += damping*delta*this.getForce()*direction.y;
      this.player.setPos(playerPos);

   };


   this.add = function(stage){
      stage.addChild(this.base.getEaselShape());
      stage.addChild(this.stick.getEaselShape());
      stage.update();
   }

}

//Button for opting in or out of teams
function TeamButton(pos, color, player){

   //TODO make baseSize some kind of global variable
   var baseSize = 35;
   Circle.call(this, pos, color, baseSize);

   this.player = player;

   this.getEaselShape().on("click", function(e){
      player.diseaseZone.invertAllowsTeams();
   });
}
//Controls ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

//Dragable Class: Makes objects Dragable
function Dragable(pos, color){

   //Call superclass's constructor
   EaselObject.call(this, pos, color);

   //Update coordinates while object is moved while pressed
   this.getEaselShape().on("pressmove", function(e){
      e.target.x = e.stageX; //(stageX, stageY) = mouseCoordinate
      e.target.y = e.stageY;
   });

};




//Class definitions:^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
exports.EaselObject = EaselObject;
exports.Circle      = Circle;
exports.Rectangle   = Rectangle;
exports.Resource    = Resource;
exports.Camera      = Camera;
exports.DiseaseZone = DiseaseZone;
exports.Player      = Player;
exports.Joystick    = Joystick;
exports.TeamButton  = TeamButton;

},{}],2:[function(require,module,exports){
/* IMPORTANT: Several variables in this js, like "io", exist because
   mainGame.js is included below socket.io.js in views/citizen.handlebars.
    */


/* Import classes */

//Requiring enabled by browserify

var EaselObject = require("./Classes").EaselObject;
var Circle      = require("./Classes").Circle;
var Rectangle   = require("./Classes").Rectangle;
var Resource    = require("./Classes").Resource;
var Camera      = require("./Classes").Camera;
var DiseaseZone = require("./Classes").DiseaseZone;
var Player      = require("./Classes").Player;
var Joystick    = require("./Classes").Joystick;
var TeamButton  = require("./Classes").TeamButton;


var gameport = 8080; //port clients will connect to 
var canvas = document.getElementById("mainCanvas");
var context = canvas.getContext("2d");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight; 

var stage        = new createjs.Stage("mainCanvas");

var player,
    remotePlayers,
    deltaTime,
    socket;

main();


function main(){
   
   //Initialize the game world
   var world        = initWorld();
   var background   = initBackground(stage, canvas);

   
   //Initalize the game controls and player
   player           = initPlayer(stage);
   //player.setCamera(new Camera(player.getPos(), canvas.width, canvas.height));
   var leftJoystick = initJoysticks(stage, player).left;
   var teamButton   = initTeamButton(stage, player);

   //Initialize array of resource objects and resource text
   var resources    = initResources(stage, canvas);
   var resourceText = initResourceText(stage,canvas, player);

   //Initialize Pathfinding
   var easystar = initPathfinding(world, player, background); 
   
   //Enable touch based interface for mobile devices
   createjs.Touch.enable(stage);

   //Resize canvas on window resize   
   window.addEventListener("resize", function(){
      stage.canvas.width  = window.innerWidth;
      stage.canvas.height = window.innerHeight;
      background.width    = window.innerWidth;
      background.height   = window.innerHeight;
      background.draw();

      //TODO encapsulate these offsets within Joystick and TeamButton
      leftJoystick.setPos({x: window.innerWidth/6, y: window.innerHeight/2});
      teamButton.setPos({x: window.innerWidth - window.innerWidth/6, y: window.innerHeight/2});


   }, false);
   

   /* Multiplayer initialization code */
   //Connect client to server 
   socket = io.connect();
   
   //Initialize remote players 
   remotePlayers = [];

   //Listen for events
   setEventHandlers();


   //Main game loop----------------------------------------------
   var FPS = 50;
   createjs.Ticker.setFPS(FPS);
   var previousTime = (new Date()).getTime();
   var currentTime;
   // pixels/frame * frames/second = pixels/second: delta time is
   // empirical FPS
   createjs.Ticker.addEventListener("tick", function(){

      //Logic to create deltaTime so movement is relative to time
      //rather than frames.
      var timer = new Date();
      currentTime = timer.getTime();
      deltaTime = currentTime - previousTime;
      previousTime = currentTime;

      //Do pathfinding calculation
      easystar.calculate();

      //Move player according to joystick
      leftJoystick.move(deltaTime);

      //Check if player is colliding with resources
      player.pickup(stage, resources);

      //Move along calculated pathfinding path
      pathPlayers(player,deltaTime);

      //Update resource text
      resourceText.text = "Resources: "+player.getResources();

      //Commit all updates to actual stage/canvas
      stage.update();

   });

}
//Utility functions:------------------------------------------------

//Utility function for comparing arrays for equality
Array.prototype.equals = function( array ) {
  return this.length == array.length && 
           this.every( function(this_i,i) { return this_i == array[i] } )  
}


//Utility functions:^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

function pathPlayers(player,deltaTime){
     
      var newPathPos;
      player.goPath(deltaTime);
      socket.emit("move player", {  x: player.getPos().x,
                                    y: player.getPos().y });
      for(i = 0; i < remotePlayers.length; i++) {
         currPlayer = remotePlayers[i];
         newPathPos = currPlayer.goPath(deltaTime);

         //Each player already updates their own position on the server,
         //this call is unecessary
         /*socket.emit("move player", {  x: newPathPos.x
                                       y: newPathPos.y });*/
      }
}

//Creates a square world of size 1000 that our pathfinding algorithm can use
function initWorld(){
 //TODO make size of canvas, resize with canvas
   var size = 1000;
   var world = []
   for(var i = 0; i < size; i++){
      world[i] = []
      for(var j = 0; j < size; j++){
         world[i][j] =0;
      }
   }
   return world;
}

//Creates and displayes the Resources: x text
function initResourceText(stage, canvas, player){
   resourceText = new createjs.Text("Resources: "+player.getResources(), "20px Arial", "white");
   resourceText.x = 0;
   resourceText.y = canvas.height/12; //TODO more logically position Resources text
   resourceText.textBaseline = "alphabet"; //Not sure what this setting does
   stage.addChild(resourceText);
   return resourceText;

}

//Creates an array of randomly placed Resources on the stage
function initResources(stage, canvas){

   var numResources = 3; //TODO make global/make logical choice. Too high a number may incur resource problems
   var currPos = {x: 0, y: 0};
   var resources = [];
   var resourceValue = 10;

   for (i = 0; i < numResources; i ++){
      currPos.x = Math.floor((Math.random() * canvas.width)); //Random number from zero to canvas.width
      currPos.y = Math.floor((Math.random() * canvas.height));

      var resource = new Resource(resourceValue);
      resource.setPos(currPos);
      resource.add(stage);
      resources.push(resource);
   }

   return resources;
}

//Create an object to represent the background and register pathfinding events
function initBackground(stage, canvas){
   var color = "black";
   var width = canvas.width;
   var height = canvas.height;

   
   
   var background = new Rectangle( {x: width/2, y: height/2}, color, width, height);
   background.add(stage);

   return background;

}

//Create desired Joysticks for the user
function initJoysticks(stage, player){
   var canvas = document.getElementById("mainCanvas");
   //var right  = new Joystick({x:canvas.width - canvas.width/6, y: canvas.height/2});
   var left = new Joystick({x: canvas.width/6, y: canvas.height/2}, player);

   //Add to canvas
   //right.add(stage);
   left.add(stage);

   return {left: left};
}

//Creates a player and associates it to a joystick
function initPlayer(stage){

   //Init local player
   player = new Player({x: stage.canvas.width/2, y: stage.canvas.height/2});
   player.add(stage);


   return player;
}

//Creates a button that allows users to opt in or out of teams
function initTeamButton(stage, player){

   //Put button at right of joystick
   var buttonPos = {x: stage.canvas.width - stage.canvas.width/6, y: stage.canvas.height/2};
   var teamButton = new TeamButton(buttonPos, "grey", player);
   teamButton.add(stage);

   return teamButton;
}

//Initialize A* pathfinding with easystar libary
function initPathfinding(world, player, background){

   var easystar = new EasyStar.js();
   easystar.setGrid(world);
   easystar.setAcceptableTiles([0]); //tiles we're able to walk on
   easystar.enableDiagonals(); 
   
   //Generate path when background is clicked
   background.getEaselShape().on("click", function(e){
         var pos = player.getPos();
         
         easystar.findPath(Math.floor(pos.x), Math.floor(pos.y), 
                           Math.floor(e.stageX), Math.floor(e.stageY), 
                           function(path){ 
              if( path === null) {
                  console.log("Path not found");
              }
              else{
                  player.path = path;
              }
         });
   });
   return easystar;
}

function setEventHandlers() {
   socket.on("connect", onSocketConnected);
   socket.on("disconnect", onSocketDisconnect);
   socket.on("new player", onNewPlayer);
   socket.on("move player", onMovePlayer);
   socket.on("remove player", onRemovePlayer);
};

function onSocketConnected() {
   console.log("Client :: Client connected on port : "+gameport); 
   socket.emit("new player", {    x: stage.canvas.width/2, 
                                  y: stage.canvas.height/2 });
}

function onSocketDisconnect() {
   console.log("Client :: Client disconnected from port : "+gameport); //Global
   //Clear all remote players/game objects

   //Clear remote Players
   for( i = 0; i < remotePlayers.length; i++){
         current = remotePlayers[i];
         current.remove(stage);
   }
   remotePlayers = [];

}

function onNewPlayer(data) {
   console.log("Client :: New player "+data.id+"connected on port : "+gameport);

   
   var newPlayer = new Player({x: data.x, y: data.y}); //TODO rewrite player 

   newPlayer.id = data.id;
   newPlayer.add(stage); //stage = current stage global
   remotePlayers.push(newPlayer);

}

function onMovePlayer(data) {
   var movePlayer = playerById(data.id);

   if(!movePlayer) {
      console.log("Client :: Player not found: " + data.id);
      return;
   }

   movePlayer.setPos({x: data.x, y: data.y});
}

function onRemovePlayer(data) {
   var removePlayer = playerById(data.id);

   if(!removePlayer) {
      console.log("Client :: Player not found: "+data.id);
      return;
   };

   //Remove the player from remoteplayers array
   removePlayer.remove(stage); //Global stage
   remotePlayers.splice(remotePlayers.indexOf(removePlayer),1);
}

// Multiplayer Helper Functions 
function playerById(id){
   var i ;
   for( i = 0; i < remotePlayers.length; i++) {
      if(remotePlayers[i].id == id)
            return remotePlayers[i];
   };

   return false;
}



},{"./Classes":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInB1YmxpYy9qcy9DbGFzc2VzLmpzIiwicHVibGljL2pzL21haW5HYW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8vVXRpbGl0eSBmdW5jdGlvbnM6LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vVXRpbGl0eSBmdW5jdGlvbiBmb3IgY29tcGFyaW5nIGFycmF5cyBmb3IgZXF1YWxpdHlcbkFycmF5LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiggYXJyYXkgKSB7XG4gIHJldHVybiB0aGlzLmxlbmd0aCA9PSBhcnJheS5sZW5ndGggJiYgXG4gICAgICAgICAgIHRoaXMuZXZlcnkoIGZ1bmN0aW9uKHRoaXNfaSxpKSB7IHJldHVybiB0aGlzX2kgPT0gYXJyYXlbaV0gfSApICBcbn1cblxuXG4vL1V0aWxpdHkgZnVuY3Rpb25zOl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuXG5cbi8vQ2xhc3MgZGVmaW5pdGlvbnM6LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vQmFzZSBjbGFzcyBmb3IgYWxsIHByaW1pdGl2ZSBvYmplY3RzIHRoYXQgZ2V0IGRyYXduXG5mdW5jdGlvbiBFYXNlbE9iamVjdCggcG9zLCBjb2xvcil7XG5cbiAgIHRoaXMuZWFzZWxTaGFwZSA9IG5ldyBjcmVhdGVqcy5TaGFwZSgpO1xuICAgdGhpcy5nZXRFYXNlbFNoYXBlID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuZWFzZWxTaGFwZTsgfTtcblxuICAgLy9TZXQgaW5pdGlhbCBwb3NpdGlvblxuICAgdGhpcy5lYXNlbFNoYXBlLnggPSBwb3MueDtcbiAgIHRoaXMuZWFzZWxTaGFwZS55ID0gcG9zLnk7XG5cbiAgIC8vUG9zaXRpb24gc2V0dGVycyBhbmQgZ2V0dGVyc1xuICAgdGhpcy5nZXRQb3MgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHt4OiB0aGlzLmdldEVhc2VsU2hhcGUoKS54LCB5OiB0aGlzLmdldEVhc2VsU2hhcGUoKS55fTsgfTtcbiAgIHRoaXMuc2V0UG9zID0gZnVuY3Rpb24ocG9zKSB7IHRoaXMuZ2V0RWFzZWxTaGFwZSgpLnggPSBwb3MueDsgdGhpcy5nZXRFYXNlbFNoYXBlKCkueSA9IHBvcy55O307XG5cbiAgIC8vVGhlIG9iamVjdCdzIGNvbG9yXG4gICB0aGlzLmNvbG9yID0gY29sb3I7XG5cbiAgIC8vQWRkcyB0aGUgY3VycmVudCBvYmplY3QgdG8gdGhlIHN0YWdlXG4gICB0aGlzLmFkZCA9IGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICBzdGFnZS5hZGRDaGlsZCh0aGlzLmdldEVhc2VsU2hhcGUoKSk7XG4gICAgICBzdGFnZS51cGRhdGUoKTtcbiAgIH07XG5cbiAgIC8vUmVtb3ZlcyB0aGUgY3VycmVudCBvYmplY3QgZnJvbSB0aGUgc3RhZ2VcbiAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHN0YWdlLnJlbW92ZUNoaWxkKHRoaXMuZ2V0RWFzZWxTaGFwZSgpKTtcbiAgIH07XG59XG5cbi8vQSBjbGFzcyBmb3IgcmVwcmVzZW50aW5nIGNpcmNsZXNcbmZ1bmN0aW9uIENpcmNsZShwb3MsIGNvbG9yLCByYWRpdXMgKXtcbiAgIC8vQ2FsbCBjb25zdHJ1Y3RvciBvZiBzdXBlcmNsYXNzXG4gICBFYXNlbE9iamVjdC5jYWxsKHRoaXMsIHBvcywgY29sb3IpOyAgXG5cbiAgIC8vU2V0IHRoZSBuZXcgcmFkaXVzXG4gICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcblxuICAgLy9GdW5jdGlvbjogZHJhdyBhIGNpcmNsZVxuICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5jbGVhcigpO1xuICAgICAgdGhpcy5lYXNlbFNoYXBlLmdyYXBoaWNzLmJlZ2luRmlsbCh0aGlzLmNvbG9yKS5kcmF3Q2lyY2xlKDAsMCx0aGlzLnJhZGl1cyk7XG4gICB9XG5cbiAgIC8vRnVuY3Rpb246IGRyYXcgYSBkb3R0ZWQgY2lyY2xlXG4gICB0aGlzLmRyYXdEb3R0ZWQgPSBmdW5jdGlvbigpe1xuICAgICAgdGhpcy5lYXNlbFNoYXBlLmdyYXBoaWNzLmNsZWFyKCk7XG5cbiAgICAgIC8vMjAgcGl4ZWwgbGluZXMgd2l0aCA1IHBpeGVsIGdhcHNcbiAgICAgIC8vdGhpcy5lYXNlbFNoYXBlLmdyYXBoaWNzLnNldFN0cm9rZURhc2goWzIwLDVdKTtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5zZXRTdHJva2VTdHlsZSgyKS5iZWdpblN0cm9rZSh0aGlzLmNvbG9yKS5kcmF3Q2lyY2xlKDAsMCx0aGlzLnJhZGl1cyk7XG4gICB9XG4gICAgXG4gICB0aGlzLmRyYXcoKTtcbn1cblxuZnVuY3Rpb24gUmVjdGFuZ2xlKHBvcywgY29sb3IsIHdpZHRoLCBoZWlnaHQpe1xuICAgRWFzZWxPYmplY3QuY2FsbCh0aGlzLCBwb3MsIGNvbG9yKTtcblxuICAgdGhpcy53aWR0aCAgPSB3aWR0aDtcbiAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cbiAgIC8vRWFzZWwuanMgZHJhd3MgcmVjdGFuZ2xlcyB1c2luZyBjb29yZGluYXRlcyByZXByZXNlbnRpbmcgdGhlIHJlY3RhbmdsZSdzIHVwcGVyIGxlZnQgY29ybmVyXG4gICAvL1RoZSBwb3NpdGlvbiBvZmZzZXRzIGhlcmUgZHJhdyB0aGUgcmVjdGFuZ2xlIHN1Y2ggdGhhdCBwb3MgcmVwcmVzZW50cyB0aGUgY2VudGVyIGlmIGl0LiBcbiAgIHRoaXMuZWFzZWxTaGFwZS54IC09ICB0aGlzLndpZHRoLzJcbiAgIHRoaXMuZWFzZWxTaGFwZS55IC09ICB0aGlzLmhlaWdodC8yXG4gICBcbiAgIC8vRHJhdyB0aGUgcmVjdGFuZ2xlXG4gICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xuICAgICAgdGhpcy5lYXNlbFNoYXBlLmdyYXBoaWNzLmNsZWFyKCk7XG4gICAgICB0aGlzLmdldEVhc2VsU2hhcGUoKS5ncmFwaGljcy5iZWdpbkZpbGwodGhpcy5jb2xvcikuZHJhd1JlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgfVxuICAgdGhpcy5kcmF3KCk7XG5cbn1cblxuZnVuY3Rpb24gUmVzb3VyY2UodmFsdWUpe1xuICAgQ2lyY2xlLmNhbGwodGhpcywge3g6IDAsIHk6IDB9LCBcIndoaXRlXCIsIDEwKTtcbiAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gRGlzZWFzZVpvbmUocGxheWVyUG9zKXtcbiAgIENpcmNsZS5jYWxsKHRoaXMsIHBsYXllclBvcywgXCJyZWRcIiwgNzUpO1xuICAgdGhpcy5kcmF3RG90dGVkKCk7XG4gICB0aGlzLkFsbG93c1RlYW1zID0gZmFsc2U7XG5cbiAgIC8vSW52ZXJ0cyB3aGV0aGVyIHRoZSBkaXNlYXNlWm9uZSBhbGxvd3MgdGVhbXNcbiAgIC8vVE9ETyBtYWtlIHByb3BlcnR5IG9mIHBsYXllclxuICAgdGhpcy5pbnZlcnRBbGxvd3NUZWFtcyA9IGZ1bmN0aW9uKCl7XG5cbiAgICAgLy9TZXQgdG8gbm90IGFsbG93IHRlYW1zXG4gICAgIGlmKHRoaXMuQWxsb3dzVGVhbXMgPT09IHRydWUpe1xuICAgICAgICB0aGlzLmNvbG9yID0gXCJyZWRcIjtcbiAgICAgICAgdGhpcy5kcmF3RG90dGVkKCk7XG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBcImdyZWVuXCI7XG4gICAgICAgIHRoaXMuZHJhd0RvdHRlZCgpO1xuICAgICB9XG4gICAgIHRoaXMuQWxsb3dzVGVhbXMgPSAhdGhpcy5BbGxvd3NUZWFtcztcbiAgIH07XG4gICBcbn1cblxuZnVuY3Rpb24gQ2FtZXJhKHBvcywgd2lkdGgsIGhlaWdodCl7XG4gICB0aGlzLnBvcyA9IHBvcztcbiAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgdGhpcy5nZXRQb3MgPSBmdW5jdGlvbigpe3JldHVybiB0aGlzLnBvczt9O1xuICAgdGhpcy5zZXRQb3MgPSBmdW5jdGlvbihwb3MpIHt0aGlzLnBvcyA9IHBvczt9O1xuICAgdGhpcy5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMud2lkdGg7fTtcbiAgIHRoaXMuc2V0V2lkdGggPSBmdW5jdGlvbih3aWR0aCkge3RoaXMud2lkdGggPSB3aWR0aDt9O1xuICAgdGhpcy5nZXRIZWlnaHQgPSBmdW5jdGlvbigpe3JldHVybiB0aGlzLmhlaWdodDt9O1xuICAgdGhpcy5zZXRIZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHt0aGlzLmhlaWdodCA9IGhlaWdodDt9O1xufVxuXG5mdW5jdGlvbiBQbGF5ZXIocG9zKXtcbiAgIENpcmNsZS5jYWxsKCB0aGlzLCBwb3MsIFwicmVkXCIsIDIwKTtcbiAgICAvL3t4OiBjYW52YXMud2lkdGgvMiwgeTogY2FudmFzLmhlaWdodC8yfSwgXCJyZWRcIiwgMjApO1xuICAgXG5cbiAgIHRoaXMuaWQ7XG4gICB0aGlzLmRpc2Vhc2Vab25lID0gbmV3IERpc2Vhc2Vab25lKHRoaXMuZ2V0UG9zKCkpO1xuICAgdGhpcy5yZXNvdXJjZXMgPSAwO1xuICAgdGhpcy5jYW1lcmEgPSB7fTtcbiAgIHRoaXMucGF0aCA9IFtdO1xuXG4gICAvL3RoaXMuZ2V0Q2FtZXJhID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMuY2FtZXJhO307XG4gICAvL3RoaXMuc2V0Q2FtZXJhID0gZnVuY3Rpb24oY2FtZXJhKXsgdGhpcy5jYW1lcmEgPSBjYW1lcmE7IH07XG4gICBcbiAgIC8vTW92ZXMgdGhlIHBsYXllciBhbG9uZyBhIHBhdGggZGV0ZXJtaW5lZCBieSBBKiBhbGdvcml0aG1cbiAgIHRoaXMuZ29QYXRoID0gZnVuY3Rpb24oZGVsdGFUaW1lKXtcbiAgICAgIFxuICAgICAgaWYodGhpcy5wYXRoLmVxdWFscyhbXSkgPT09IGZhbHNlKVxuICAgICAge1xuICAgICAgICAgdmFyIHBvcyA9IHt4OiB0aGlzLnBhdGhbMF0ueCwgeTogdGhpcy5wYXRoWzBdLnl9O1xuICAgICAgICAgdGhpcy5zZXRQb3MocG9zKTtcbiAgICAgICAgIHRoaXMucGF0aC5zcGxpY2UoMCwgMSpkZWx0YVRpbWUpOyAvL1JlbW92ZSBkZWx0YVRpbWUgZWxlbWVudHMgc3RhcnRpbmcgZnJvbSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9lbGVtZW50IDA7XG4gICAgICAgICByZXR1cm4gcG9zO1xuICAgICAgfVxuICAgICB2YXIgcG9zID0ge3g6IHRoaXMuZ2V0UG9zKCkueCwgeTogdGhpcy5nZXRQb3MoKS55fTsgXG4gICAgICByZXR1cm4gcG9zO1xuICAgfVxuXG4gICB0aGlzLmdldFJlc291cmNlcyA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLnJlc291cmNlczt9O1xuICAgdGhpcy5zZXRSZXNvdXJjZXMgPSBmdW5jdGlvbihuZXdSZXNvdXJjZXMpeyB0aGlzLnJlc291cmNlcyA9IG5ld1Jlc291cmNlc307XG5cbiAgIC8vT3ZlcnJpZGUgaW5oZXJpdGVkIHNldFBvc1xuICAgdmFyIHBhcmVudFNldFBvcyA9IHRoaXMuc2V0UG9zO1xuICAgdGhpcy5zZXRQb3MgPSBmdW5jdGlvbihwb3MpeyBcbiAgICAgICAvL3RoaXMuY2FtZXJhLnNldFBvcyhwb3MpO1xuICAgICAgIHRoaXMuZGlzZWFzZVpvbmUuc2V0UG9zKHBvcyk7XG4gICAgICAgcGFyZW50U2V0UG9zLmNhbGwodGhpcywgcG9zKTsgLy9uZWVkIGNhbGwgc28gJ3RoaXMnIGlzIGRlZmluZWQgYXMgdGhlIGN1cnJlbnQgUGxheWVyXG4gICB9O1xuICAgdGhpcy5zZXRQb3MocG9zKTtcblxuICAgLy9PdmVycmlkZSBpbmhlcml0ZWQgYWRkXG4gICB2YXIgcGFyZW50QWRkID0gdGhpcy5hZGQ7XG4gICB0aGlzLmFkZCA9IGZ1bmN0aW9uKHN0YWdlKXtcbiAgICAgIHRoaXMuZGlzZWFzZVpvbmUuYWRkKHN0YWdlKTtcbiAgICAgIHBhcmVudEFkZC5jYWxsKHRoaXMsIHN0YWdlKTtcbiAgIH1cblxuICAgdmFyIHBhcmVudFJlbW92ZSA9IHRoaXMucmVtb3ZlO1xuICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihzdGFnZSl7XG4gICAgICB0aGlzLmRpc2Vhc2Vab25lLnJlbW92ZShzdGFnZSk7XG4gICAgICBwYXJlbnRSZW1vdmUuY2FsbCh0aGlzLCBzdGFnZSk7XG4gICB9XG4gICAgICBcbiAgIC8vQ2hlY2sgaWYgc3RhbmRpbmcgb24gYW55IHJlc291cmNlc1xuICAgdGhpcy5waWNrdXAgPSBmdW5jdGlvbihzdGFnZSwgcmVzb3VyY2VzKXtcbiAgICAgIHZhciBlYXNlbFNoYXBlID0gdGhpcy5nZXRFYXNlbFNoYXBlKCk7XG4gICAgICB2YXIgcmVzb3VyY2VDb3B5ID0gcmVzb3VyY2VzLnNsaWNlKDAscmVzb3VyY2VzLmxlbmd0aCk7XG4gICAgICAvL2ZvciAodmFyIHggb2YgcmVzb3VyY2VDb3B5KXtcbiAgICAgIGZvciggaSA9IDA7IGkgPCByZXNvdXJjZUNvcHkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgdmFyIHggPSByZXNvdXJjZUNvcHlbaV07IC8vY3VycmVudCByZXNvdXJjZVxuXG4gICAgICAgICB2YXIgcG9zID0geC5nZXRQb3MoKTtcbiAgICAgICAgIHZhciBwdCA9ICBlYXNlbFNoYXBlLmdsb2JhbFRvTG9jYWwocG9zLngsIHBvcy55KTsgLy9oaXRUZXN0IG5lZWRzIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIGVhc2VsU2hhcGVcbiAgICAgICAgIGlmKGVhc2VsU2hhcGUuaGl0VGVzdChwdC54LCBwdC55KSkgLy9JZiBwbGF5ZXIgaXMgb3ZlciByZXNvdXJjZVxuICAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zZXRSZXNvdXJjZXModGhpcy5nZXRSZXNvdXJjZXMoKSArIHgudmFsdWUpO1xuICAgICAgICAgICAgdmFyIHJlbUluZGV4ID0gcmVzb3VyY2VzLmluZGV4T2YoeCk7XG4gICAgICAgICAgICByZXNvdXJjZXMuc3BsaWNlKHJlbUluZGV4LDEpO1xuICAgICAgICAgICAgeC5yZW1vdmUoc3RhZ2UpO1xuICAgICAgICAgfVxuICAgICAgfVxuICAgfVxufVxuXG4vL0NvbnRyb2xzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vL0NyZWF0ZXMgYSBKb3lzdGljayBhdCB0aGUgZ2l2ZW4gbG9jYXRpb25cbmZ1bmN0aW9uIEpveXN0aWNrKHBvcywgcGxheWVyKXtcblxuICAgdGhpcy5wb3MgPSBwb3M7XG4gICB0aGlzLnBsYXllciA9IHBsYXllcjtcblxuICAgdGhpcy5iYXNlU2l6ZSA9IDM1O1xuICAgdGhpcy5iYXNlQ29sb3IgPSBcImdyZXlcIjtcbiAgIHRoaXMuYmFzZSA9IG5ldyBDaXJjbGUodGhpcy5wb3MsIHRoaXMuYmFzZUNvbG9yLCB0aGlzLmJhc2VTaXplKTtcblxuICAgdGhpcy5zdGlja1NpemUgPSAyNTtcbiAgIHRoaXMuc3RpY2tDb2xvciA9IFwid2hpdGVcIjtcbiAgIHRoaXMuc3RpY2sgPSAgbmV3IENpcmNsZSh0aGlzLnBvcywgdGhpcy5zdGlja0NvbG9yLCB0aGlzLnN0aWNrU2l6ZSk7XG5cbiAgIC8vTGltaXRlZCBEcmFnZ2luZ1xuICAgdGhpcy5zdGljay5nZXRFYXNlbFNoYXBlKCkub24oXCJwcmVzc21vdmVcIiwgZnVuY3Rpb24oZSl7XG4gICAgICBlLnRhcmdldC54ID0gZS5zdGFnZVg7IC8vKHN0YWdlWCwgc3RhZ2VZKSA9IG1vdXNlQ29vcmRpbmF0ZVxuICAgICAgZS50YXJnZXQueSA9IGUuc3RhZ2VZO1xuICAgfSk7XG4gICBcbiAgIHZhciBiYXNlVmFyID0gdGhpcy5iYXNlOyAvL05vIGlkZWEgd2h5IEkgaGF2ZSB0byBkbyB0aGlzOyBzY29waW5nP1xuICAgLy9SZXNldCBzdGljayB0byBiYXNlIHBvdGl0aW9uIG9uIHdoZW4gam95c3RpY2sgaXMgcmVsZWFzZWRcbiAgIHRoaXMuc3RpY2suZ2V0RWFzZWxTaGFwZSgpLm9uKFwicHJlc3N1cFwiLCBmdW5jdGlvbihlKXtcbiAgICAgIGUudGFyZ2V0LnggPSBiYXNlVmFyLmdldFBvcygpLng7ICBcbiAgICAgIGUudGFyZ2V0LnkgPSBiYXNlVmFyLmdldFBvcygpLnk7XG4gICB9KTtcbiAgIFxuICAgdGhpcy5nZXRQb3MgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuYmFzZS5nZXRQb3MoKX07XG4gICB0aGlzLnNldFBvcyA9IGZ1bmN0aW9uKHBvcykge1xuICAgICAgdGhpcy5iYXNlLnNldFBvcyhwb3MpO1xuICAgICAgdGhpcy5zdGljay5zZXRQb3MocG9zKTtcbiAgIH1cblxuICAgLy9HZXQgdGhlIGRpcmVjdGlvbiB0aGUgam95c3RpY2sgaXMgcG9pbnRpbmdcbiAgIHRoaXMuZ2V0RGlyZWN0aW9uID0gZnVuY3Rpb24oKXtcbiAgICAgIHZhciB2ID0gdGhpcy5zdGljay5nZXRQb3MoKTtcbiAgICAgIHZhciB3ID0gdGhpcy5iYXNlLmdldFBvcygpO1xuICAgICAgdmFyIHgxID0gdi54IC0gdy54OyAvL25ldyBjb29yZGluYXRlc1xuICAgICAgdmFyIHkxID0gdi55IC0gdy55O1xuICAgICAgdmFyIG1hZzEgPSBNYXRoLnNxcnQoeDEqeDEgKyB5MSp5MSk7XG5cbiAgICAgIHJldHVybiB7eDogeDEvbWFnMSwgeTogeTEvbWFnMX1cbiAgIH07XG5cbiAgIC8vR2V0IHRoZSBmb3JjZSBhY3Rpbmcgb24gYSBwbGF5ZXIgYnkgdGhlIGpveXN0aWNrXG4gICB0aGlzLmdldEZvcmNlID0gZnVuY3Rpb24oKXtcbiAgICAgIHZhciB2ID0gdGhpcy5zdGljay5nZXRQb3MoKTtcbiAgICAgIHZhciB3ID0gdGhpcy5iYXNlLmdldFBvcygpO1xuICAgICAgcmV0dXJuIE1hdGguYWJzKE1hdGguc3FydCh2Lngqdi54ICsgdi55KnYueSkgLSBNYXRoLnNxcnQody54KncueCArIHcueSp3LnkpKTtcbiAgIH07XG5cblxuICAgLy9VcGRhdGUgcGxheWVyJ3MgbG9jYXRpb24gd2l0aCByZXNwZWN0IHRvIGpveXN0aWNrXG4gICB0aGlzLm1vdmUgPSBmdW5jdGlvbiAoZGVsdGEpIHsgLy9EZWx0YSBpcyBkZWx0YVRpbWVcblxuICAgICAgLy9Nb3ZlIHBsYXllciB3aXRoIGxlZnQgam95c3RpY2tcbiAgICAgIHZhciBwbGF5ZXJQb3MgPSB0aGlzLnBsYXllci5nZXRQb3MoKTtcbiAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbigpO1xuXG4gICAgICAvL1RPRE8gbWFrZSBkYW1waW5nIHBsYXllciBwcm9wZXJ0eVxuICAgICAgdmFyIGRhbXBpbmcgPSAxLzIwO1xuICAgICAgaWYoaXNOYU4oZGlyZWN0aW9uLngpIHx8IGlzTmFOKGRpcmVjdGlvbi55KSlcbiAgICAgIHtcbiAgICAgICAgIGRpcmVjdGlvbi54ID0gMDtcbiAgICAgICAgIGRpcmVjdGlvbi55ID0gMDtcbiAgICAgIH1cbiAgICAgIHBsYXllclBvcy54ICs9IGRhbXBpbmcqZGVsdGEqdGhpcy5nZXRGb3JjZSgpKmRpcmVjdGlvbi54O1xuICAgICAgcGxheWVyUG9zLnkgKz0gZGFtcGluZypkZWx0YSp0aGlzLmdldEZvcmNlKCkqZGlyZWN0aW9uLnk7XG4gICAgICB0aGlzLnBsYXllci5zZXRQb3MocGxheWVyUG9zKTtcblxuICAgfTtcblxuXG4gICB0aGlzLmFkZCA9IGZ1bmN0aW9uKHN0YWdlKXtcbiAgICAgIHN0YWdlLmFkZENoaWxkKHRoaXMuYmFzZS5nZXRFYXNlbFNoYXBlKCkpO1xuICAgICAgc3RhZ2UuYWRkQ2hpbGQodGhpcy5zdGljay5nZXRFYXNlbFNoYXBlKCkpO1xuICAgICAgc3RhZ2UudXBkYXRlKCk7XG4gICB9XG5cbn1cblxuLy9CdXR0b24gZm9yIG9wdGluZyBpbiBvciBvdXQgb2YgdGVhbXNcbmZ1bmN0aW9uIFRlYW1CdXR0b24ocG9zLCBjb2xvciwgcGxheWVyKXtcblxuICAgLy9UT0RPIG1ha2UgYmFzZVNpemUgc29tZSBraW5kIG9mIGdsb2JhbCB2YXJpYWJsZVxuICAgdmFyIGJhc2VTaXplID0gMzU7XG4gICBDaXJjbGUuY2FsbCh0aGlzLCBwb3MsIGNvbG9yLCBiYXNlU2l6ZSk7XG5cbiAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuXG4gICB0aGlzLmdldEVhc2VsU2hhcGUoKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgcGxheWVyLmRpc2Vhc2Vab25lLmludmVydEFsbG93c1RlYW1zKCk7XG4gICB9KTtcbn1cbi8vQ29udHJvbHMgXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXG5cbi8vRHJhZ2FibGUgQ2xhc3M6IE1ha2VzIG9iamVjdHMgRHJhZ2FibGVcbmZ1bmN0aW9uIERyYWdhYmxlKHBvcywgY29sb3Ipe1xuXG4gICAvL0NhbGwgc3VwZXJjbGFzcydzIGNvbnN0cnVjdG9yXG4gICBFYXNlbE9iamVjdC5jYWxsKHRoaXMsIHBvcywgY29sb3IpO1xuXG4gICAvL1VwZGF0ZSBjb29yZGluYXRlcyB3aGlsZSBvYmplY3QgaXMgbW92ZWQgd2hpbGUgcHJlc3NlZFxuICAgdGhpcy5nZXRFYXNlbFNoYXBlKCkub24oXCJwcmVzc21vdmVcIiwgZnVuY3Rpb24oZSl7XG4gICAgICBlLnRhcmdldC54ID0gZS5zdGFnZVg7IC8vKHN0YWdlWCwgc3RhZ2VZKSA9IG1vdXNlQ29vcmRpbmF0ZVxuICAgICAgZS50YXJnZXQueSA9IGUuc3RhZ2VZO1xuICAgfSk7XG5cbn07XG5cblxuXG5cbi8vQ2xhc3MgZGVmaW5pdGlvbnM6Xl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXG5leHBvcnRzLkVhc2VsT2JqZWN0ID0gRWFzZWxPYmplY3Q7XG5leHBvcnRzLkNpcmNsZSAgICAgID0gQ2lyY2xlO1xuZXhwb3J0cy5SZWN0YW5nbGUgICA9IFJlY3RhbmdsZTtcbmV4cG9ydHMuUmVzb3VyY2UgICAgPSBSZXNvdXJjZTtcbmV4cG9ydHMuQ2FtZXJhICAgICAgPSBDYW1lcmE7XG5leHBvcnRzLkRpc2Vhc2Vab25lID0gRGlzZWFzZVpvbmU7XG5leHBvcnRzLlBsYXllciAgICAgID0gUGxheWVyO1xuZXhwb3J0cy5Kb3lzdGljayAgICA9IEpveXN0aWNrO1xuZXhwb3J0cy5UZWFtQnV0dG9uICA9IFRlYW1CdXR0b247XG4iLCIvKiBJTVBPUlRBTlQ6IFNldmVyYWwgdmFyaWFibGVzIGluIHRoaXMganMsIGxpa2UgXCJpb1wiLCBleGlzdCBiZWNhdXNlXG4gICBtYWluR2FtZS5qcyBpcyBpbmNsdWRlZCBiZWxvdyBzb2NrZXQuaW8uanMgaW4gdmlld3MvY2l0aXplbi5oYW5kbGViYXJzLlxuICAgICovXG5cblxuLyogSW1wb3J0IGNsYXNzZXMgKi9cblxuLy9SZXF1aXJpbmcgZW5hYmxlZCBieSBicm93c2VyaWZ5XG5cbnZhciBFYXNlbE9iamVjdCA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuRWFzZWxPYmplY3Q7XG52YXIgQ2lyY2xlICAgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkNpcmNsZTtcbnZhciBSZWN0YW5nbGUgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuUmVjdGFuZ2xlO1xudmFyIFJlc291cmNlICAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5SZXNvdXJjZTtcbnZhciBDYW1lcmEgICAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuQ2FtZXJhO1xudmFyIERpc2Vhc2Vab25lID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5EaXNlYXNlWm9uZTtcbnZhciBQbGF5ZXIgICAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuUGxheWVyO1xudmFyIEpveXN0aWNrICAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5Kb3lzdGljaztcbnZhciBUZWFtQnV0dG9uICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuVGVhbUJ1dHRvbjtcblxuXG52YXIgZ2FtZXBvcnQgPSA4MDgwOyAvL3BvcnQgY2xpZW50cyB3aWxsIGNvbm5lY3QgdG8gXG52YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluQ2FudmFzXCIpO1xudmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuY2FudmFzLndpZHRoICA9IHdpbmRvdy5pbm5lcldpZHRoO1xuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDsgXG5cbnZhciBzdGFnZSAgICAgICAgPSBuZXcgY3JlYXRlanMuU3RhZ2UoXCJtYWluQ2FudmFzXCIpO1xuXG52YXIgcGxheWVyLFxuICAgIHJlbW90ZVBsYXllcnMsXG4gICAgZGVsdGFUaW1lLFxuICAgIHNvY2tldDtcblxubWFpbigpO1xuXG5cbmZ1bmN0aW9uIG1haW4oKXtcbiAgIFxuICAgLy9Jbml0aWFsaXplIHRoZSBnYW1lIHdvcmxkXG4gICB2YXIgd29ybGQgICAgICAgID0gaW5pdFdvcmxkKCk7XG4gICB2YXIgYmFja2dyb3VuZCAgID0gaW5pdEJhY2tncm91bmQoc3RhZ2UsIGNhbnZhcyk7XG5cbiAgIFxuICAgLy9Jbml0YWxpemUgdGhlIGdhbWUgY29udHJvbHMgYW5kIHBsYXllclxuICAgcGxheWVyICAgICAgICAgICA9IGluaXRQbGF5ZXIoc3RhZ2UpO1xuICAgLy9wbGF5ZXIuc2V0Q2FtZXJhKG5ldyBDYW1lcmEocGxheWVyLmdldFBvcygpLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpKTtcbiAgIHZhciBsZWZ0Sm95c3RpY2sgPSBpbml0Sm95c3RpY2tzKHN0YWdlLCBwbGF5ZXIpLmxlZnQ7XG4gICB2YXIgdGVhbUJ1dHRvbiAgID0gaW5pdFRlYW1CdXR0b24oc3RhZ2UsIHBsYXllcik7XG5cbiAgIC8vSW5pdGlhbGl6ZSBhcnJheSBvZiByZXNvdXJjZSBvYmplY3RzIGFuZCByZXNvdXJjZSB0ZXh0XG4gICB2YXIgcmVzb3VyY2VzICAgID0gaW5pdFJlc291cmNlcyhzdGFnZSwgY2FudmFzKTtcbiAgIHZhciByZXNvdXJjZVRleHQgPSBpbml0UmVzb3VyY2VUZXh0KHN0YWdlLGNhbnZhcywgcGxheWVyKTtcblxuICAgLy9Jbml0aWFsaXplIFBhdGhmaW5kaW5nXG4gICB2YXIgZWFzeXN0YXIgPSBpbml0UGF0aGZpbmRpbmcod29ybGQsIHBsYXllciwgYmFja2dyb3VuZCk7IFxuICAgXG4gICAvL0VuYWJsZSB0b3VjaCBiYXNlZCBpbnRlcmZhY2UgZm9yIG1vYmlsZSBkZXZpY2VzXG4gICBjcmVhdGVqcy5Ub3VjaC5lbmFibGUoc3RhZ2UpO1xuXG4gICAvL1Jlc2l6ZSBjYW52YXMgb24gd2luZG93IHJlc2l6ZSAgIFxuICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24oKXtcbiAgICAgIHN0YWdlLmNhbnZhcy53aWR0aCAgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgIHN0YWdlLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICBiYWNrZ3JvdW5kLndpZHRoICAgID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICBiYWNrZ3JvdW5kLmhlaWdodCAgID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgYmFja2dyb3VuZC5kcmF3KCk7XG5cbiAgICAgIC8vVE9ETyBlbmNhcHN1bGF0ZSB0aGVzZSBvZmZzZXRzIHdpdGhpbiBKb3lzdGljayBhbmQgVGVhbUJ1dHRvblxuICAgICAgbGVmdEpveXN0aWNrLnNldFBvcyh7eDogd2luZG93LmlubmVyV2lkdGgvNiwgeTogd2luZG93LmlubmVySGVpZ2h0LzJ9KTtcbiAgICAgIHRlYW1CdXR0b24uc2V0UG9zKHt4OiB3aW5kb3cuaW5uZXJXaWR0aCAtIHdpbmRvdy5pbm5lcldpZHRoLzYsIHk6IHdpbmRvdy5pbm5lckhlaWdodC8yfSk7XG5cblxuICAgfSwgZmFsc2UpO1xuICAgXG5cbiAgIC8qIE11bHRpcGxheWVyIGluaXRpYWxpemF0aW9uIGNvZGUgKi9cbiAgIC8vQ29ubmVjdCBjbGllbnQgdG8gc2VydmVyIFxuICAgc29ja2V0ID0gaW8uY29ubmVjdCgpO1xuICAgXG4gICAvL0luaXRpYWxpemUgcmVtb3RlIHBsYXllcnMgXG4gICByZW1vdGVQbGF5ZXJzID0gW107XG5cbiAgIC8vTGlzdGVuIGZvciBldmVudHNcbiAgIHNldEV2ZW50SGFuZGxlcnMoKTtcblxuXG4gICAvL01haW4gZ2FtZSBsb29wLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgdmFyIEZQUyA9IDUwO1xuICAgY3JlYXRlanMuVGlja2VyLnNldEZQUyhGUFMpO1xuICAgdmFyIHByZXZpb3VzVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICB2YXIgY3VycmVudFRpbWU7XG4gICAvLyBwaXhlbHMvZnJhbWUgKiBmcmFtZXMvc2Vjb25kID0gcGl4ZWxzL3NlY29uZDogZGVsdGEgdGltZSBpc1xuICAgLy8gZW1waXJpY2FsIEZQU1xuICAgY3JlYXRlanMuVGlja2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aWNrXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgIC8vTG9naWMgdG8gY3JlYXRlIGRlbHRhVGltZSBzbyBtb3ZlbWVudCBpcyByZWxhdGl2ZSB0byB0aW1lXG4gICAgICAvL3JhdGhlciB0aGFuIGZyYW1lcy5cbiAgICAgIHZhciB0aW1lciA9IG5ldyBEYXRlKCk7XG4gICAgICBjdXJyZW50VGltZSA9IHRpbWVyLmdldFRpbWUoKTtcbiAgICAgIGRlbHRhVGltZSA9IGN1cnJlbnRUaW1lIC0gcHJldmlvdXNUaW1lO1xuICAgICAgcHJldmlvdXNUaW1lID0gY3VycmVudFRpbWU7XG5cbiAgICAgIC8vRG8gcGF0aGZpbmRpbmcgY2FsY3VsYXRpb25cbiAgICAgIGVhc3lzdGFyLmNhbGN1bGF0ZSgpO1xuXG4gICAgICAvL01vdmUgcGxheWVyIGFjY29yZGluZyB0byBqb3lzdGlja1xuICAgICAgbGVmdEpveXN0aWNrLm1vdmUoZGVsdGFUaW1lKTtcblxuICAgICAgLy9DaGVjayBpZiBwbGF5ZXIgaXMgY29sbGlkaW5nIHdpdGggcmVzb3VyY2VzXG4gICAgICBwbGF5ZXIucGlja3VwKHN0YWdlLCByZXNvdXJjZXMpO1xuXG4gICAgICAvL01vdmUgYWxvbmcgY2FsY3VsYXRlZCBwYXRoZmluZGluZyBwYXRoXG4gICAgICBwYXRoUGxheWVycyhwbGF5ZXIsZGVsdGFUaW1lKTtcblxuICAgICAgLy9VcGRhdGUgcmVzb3VyY2UgdGV4dFxuICAgICAgcmVzb3VyY2VUZXh0LnRleHQgPSBcIlJlc291cmNlczogXCIrcGxheWVyLmdldFJlc291cmNlcygpO1xuXG4gICAgICAvL0NvbW1pdCBhbGwgdXBkYXRlcyB0byBhY3R1YWwgc3RhZ2UvY2FudmFzXG4gICAgICBzdGFnZS51cGRhdGUoKTtcblxuICAgfSk7XG5cbn1cbi8vVXRpbGl0eSBmdW5jdGlvbnM6LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vVXRpbGl0eSBmdW5jdGlvbiBmb3IgY29tcGFyaW5nIGFycmF5cyBmb3IgZXF1YWxpdHlcbkFycmF5LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiggYXJyYXkgKSB7XG4gIHJldHVybiB0aGlzLmxlbmd0aCA9PSBhcnJheS5sZW5ndGggJiYgXG4gICAgICAgICAgIHRoaXMuZXZlcnkoIGZ1bmN0aW9uKHRoaXNfaSxpKSB7IHJldHVybiB0aGlzX2kgPT0gYXJyYXlbaV0gfSApICBcbn1cblxuXG4vL1V0aWxpdHkgZnVuY3Rpb25zOl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuXG5mdW5jdGlvbiBwYXRoUGxheWVycyhwbGF5ZXIsZGVsdGFUaW1lKXtcbiAgICAgXG4gICAgICB2YXIgbmV3UGF0aFBvcztcbiAgICAgIHBsYXllci5nb1BhdGgoZGVsdGFUaW1lKTtcbiAgICAgIHNvY2tldC5lbWl0KFwibW92ZSBwbGF5ZXJcIiwgeyAgeDogcGxheWVyLmdldFBvcygpLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBwbGF5ZXIuZ2V0UG9zKCkueSB9KTtcbiAgICAgIGZvcihpID0gMDsgaSA8IHJlbW90ZVBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgIGN1cnJQbGF5ZXIgPSByZW1vdGVQbGF5ZXJzW2ldO1xuICAgICAgICAgbmV3UGF0aFBvcyA9IGN1cnJQbGF5ZXIuZ29QYXRoKGRlbHRhVGltZSk7XG5cbiAgICAgICAgIC8vRWFjaCBwbGF5ZXIgYWxyZWFkeSB1cGRhdGVzIHRoZWlyIG93biBwb3NpdGlvbiBvbiB0aGUgc2VydmVyLFxuICAgICAgICAgLy90aGlzIGNhbGwgaXMgdW5lY2Vzc2FyeVxuICAgICAgICAgLypzb2NrZXQuZW1pdChcIm1vdmUgcGxheWVyXCIsIHsgIHg6IG5ld1BhdGhQb3MueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogbmV3UGF0aFBvcy55IH0pOyovXG4gICAgICB9XG59XG5cbi8vQ3JlYXRlcyBhIHNxdWFyZSB3b3JsZCBvZiBzaXplIDEwMDAgdGhhdCBvdXIgcGF0aGZpbmRpbmcgYWxnb3JpdGhtIGNhbiB1c2VcbmZ1bmN0aW9uIGluaXRXb3JsZCgpe1xuIC8vVE9ETyBtYWtlIHNpemUgb2YgY2FudmFzLCByZXNpemUgd2l0aCBjYW52YXNcbiAgIHZhciBzaXplID0gMTAwMDtcbiAgIHZhciB3b3JsZCA9IFtdXG4gICBmb3IodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKXtcbiAgICAgIHdvcmxkW2ldID0gW11cbiAgICAgIGZvcih2YXIgaiA9IDA7IGogPCBzaXplOyBqKyspe1xuICAgICAgICAgd29ybGRbaV1bal0gPTA7XG4gICAgICB9XG4gICB9XG4gICByZXR1cm4gd29ybGQ7XG59XG5cbi8vQ3JlYXRlcyBhbmQgZGlzcGxheWVzIHRoZSBSZXNvdXJjZXM6IHggdGV4dFxuZnVuY3Rpb24gaW5pdFJlc291cmNlVGV4dChzdGFnZSwgY2FudmFzLCBwbGF5ZXIpe1xuICAgcmVzb3VyY2VUZXh0ID0gbmV3IGNyZWF0ZWpzLlRleHQoXCJSZXNvdXJjZXM6IFwiK3BsYXllci5nZXRSZXNvdXJjZXMoKSwgXCIyMHB4IEFyaWFsXCIsIFwid2hpdGVcIik7XG4gICByZXNvdXJjZVRleHQueCA9IDA7XG4gICByZXNvdXJjZVRleHQueSA9IGNhbnZhcy5oZWlnaHQvMTI7IC8vVE9ETyBtb3JlIGxvZ2ljYWxseSBwb3NpdGlvbiBSZXNvdXJjZXMgdGV4dFxuICAgcmVzb3VyY2VUZXh0LnRleHRCYXNlbGluZSA9IFwiYWxwaGFiZXRcIjsgLy9Ob3Qgc3VyZSB3aGF0IHRoaXMgc2V0dGluZyBkb2VzXG4gICBzdGFnZS5hZGRDaGlsZChyZXNvdXJjZVRleHQpO1xuICAgcmV0dXJuIHJlc291cmNlVGV4dDtcblxufVxuXG4vL0NyZWF0ZXMgYW4gYXJyYXkgb2YgcmFuZG9tbHkgcGxhY2VkIFJlc291cmNlcyBvbiB0aGUgc3RhZ2VcbmZ1bmN0aW9uIGluaXRSZXNvdXJjZXMoc3RhZ2UsIGNhbnZhcyl7XG5cbiAgIHZhciBudW1SZXNvdXJjZXMgPSAzOyAvL1RPRE8gbWFrZSBnbG9iYWwvbWFrZSBsb2dpY2FsIGNob2ljZS4gVG9vIGhpZ2ggYSBudW1iZXIgbWF5IGluY3VyIHJlc291cmNlIHByb2JsZW1zXG4gICB2YXIgY3VyclBvcyA9IHt4OiAwLCB5OiAwfTtcbiAgIHZhciByZXNvdXJjZXMgPSBbXTtcbiAgIHZhciByZXNvdXJjZVZhbHVlID0gMTA7XG5cbiAgIGZvciAoaSA9IDA7IGkgPCBudW1SZXNvdXJjZXM7IGkgKyspe1xuICAgICAgY3VyclBvcy54ID0gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIGNhbnZhcy53aWR0aCkpOyAvL1JhbmRvbSBudW1iZXIgZnJvbSB6ZXJvIHRvIGNhbnZhcy53aWR0aFxuICAgICAgY3VyclBvcy55ID0gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIGNhbnZhcy5oZWlnaHQpKTtcblxuICAgICAgdmFyIHJlc291cmNlID0gbmV3IFJlc291cmNlKHJlc291cmNlVmFsdWUpO1xuICAgICAgcmVzb3VyY2Uuc2V0UG9zKGN1cnJQb3MpO1xuICAgICAgcmVzb3VyY2UuYWRkKHN0YWdlKTtcbiAgICAgIHJlc291cmNlcy5wdXNoKHJlc291cmNlKTtcbiAgIH1cblxuICAgcmV0dXJuIHJlc291cmNlcztcbn1cblxuLy9DcmVhdGUgYW4gb2JqZWN0IHRvIHJlcHJlc2VudCB0aGUgYmFja2dyb3VuZCBhbmQgcmVnaXN0ZXIgcGF0aGZpbmRpbmcgZXZlbnRzXG5mdW5jdGlvbiBpbml0QmFja2dyb3VuZChzdGFnZSwgY2FudmFzKXtcbiAgIHZhciBjb2xvciA9IFwiYmxhY2tcIjtcbiAgIHZhciB3aWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgIHZhciBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICBcbiAgIFxuICAgdmFyIGJhY2tncm91bmQgPSBuZXcgUmVjdGFuZ2xlKCB7eDogd2lkdGgvMiwgeTogaGVpZ2h0LzJ9LCBjb2xvciwgd2lkdGgsIGhlaWdodCk7XG4gICBiYWNrZ3JvdW5kLmFkZChzdGFnZSk7XG5cbiAgIHJldHVybiBiYWNrZ3JvdW5kO1xuXG59XG5cbi8vQ3JlYXRlIGRlc2lyZWQgSm95c3RpY2tzIGZvciB0aGUgdXNlclxuZnVuY3Rpb24gaW5pdEpveXN0aWNrcyhzdGFnZSwgcGxheWVyKXtcbiAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5DYW52YXNcIik7XG4gICAvL3ZhciByaWdodCAgPSBuZXcgSm95c3RpY2soe3g6Y2FudmFzLndpZHRoIC0gY2FudmFzLndpZHRoLzYsIHk6IGNhbnZhcy5oZWlnaHQvMn0pO1xuICAgdmFyIGxlZnQgPSBuZXcgSm95c3RpY2soe3g6IGNhbnZhcy53aWR0aC82LCB5OiBjYW52YXMuaGVpZ2h0LzJ9LCBwbGF5ZXIpO1xuXG4gICAvL0FkZCB0byBjYW52YXNcbiAgIC8vcmlnaHQuYWRkKHN0YWdlKTtcbiAgIGxlZnQuYWRkKHN0YWdlKTtcblxuICAgcmV0dXJuIHtsZWZ0OiBsZWZ0fTtcbn1cblxuLy9DcmVhdGVzIGEgcGxheWVyIGFuZCBhc3NvY2lhdGVzIGl0IHRvIGEgam95c3RpY2tcbmZ1bmN0aW9uIGluaXRQbGF5ZXIoc3RhZ2Upe1xuXG4gICAvL0luaXQgbG9jYWwgcGxheWVyXG4gICBwbGF5ZXIgPSBuZXcgUGxheWVyKHt4OiBzdGFnZS5jYW52YXMud2lkdGgvMiwgeTogc3RhZ2UuY2FudmFzLmhlaWdodC8yfSk7XG4gICBwbGF5ZXIuYWRkKHN0YWdlKTtcblxuXG4gICByZXR1cm4gcGxheWVyO1xufVxuXG4vL0NyZWF0ZXMgYSBidXR0b24gdGhhdCBhbGxvd3MgdXNlcnMgdG8gb3B0IGluIG9yIG91dCBvZiB0ZWFtc1xuZnVuY3Rpb24gaW5pdFRlYW1CdXR0b24oc3RhZ2UsIHBsYXllcil7XG5cbiAgIC8vUHV0IGJ1dHRvbiBhdCByaWdodCBvZiBqb3lzdGlja1xuICAgdmFyIGJ1dHRvblBvcyA9IHt4OiBzdGFnZS5jYW52YXMud2lkdGggLSBzdGFnZS5jYW52YXMud2lkdGgvNiwgeTogc3RhZ2UuY2FudmFzLmhlaWdodC8yfTtcbiAgIHZhciB0ZWFtQnV0dG9uID0gbmV3IFRlYW1CdXR0b24oYnV0dG9uUG9zLCBcImdyZXlcIiwgcGxheWVyKTtcbiAgIHRlYW1CdXR0b24uYWRkKHN0YWdlKTtcblxuICAgcmV0dXJuIHRlYW1CdXR0b247XG59XG5cbi8vSW5pdGlhbGl6ZSBBKiBwYXRoZmluZGluZyB3aXRoIGVhc3lzdGFyIGxpYmFyeVxuZnVuY3Rpb24gaW5pdFBhdGhmaW5kaW5nKHdvcmxkLCBwbGF5ZXIsIGJhY2tncm91bmQpe1xuXG4gICB2YXIgZWFzeXN0YXIgPSBuZXcgRWFzeVN0YXIuanMoKTtcbiAgIGVhc3lzdGFyLnNldEdyaWQod29ybGQpO1xuICAgZWFzeXN0YXIuc2V0QWNjZXB0YWJsZVRpbGVzKFswXSk7IC8vdGlsZXMgd2UncmUgYWJsZSB0byB3YWxrIG9uXG4gICBlYXN5c3Rhci5lbmFibGVEaWFnb25hbHMoKTsgXG4gICBcbiAgIC8vR2VuZXJhdGUgcGF0aCB3aGVuIGJhY2tncm91bmQgaXMgY2xpY2tlZFxuICAgYmFja2dyb3VuZC5nZXRFYXNlbFNoYXBlKCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKXtcbiAgICAgICAgIHZhciBwb3MgPSBwbGF5ZXIuZ2V0UG9zKCk7XG4gICAgICAgICBcbiAgICAgICAgIGVhc3lzdGFyLmZpbmRQYXRoKE1hdGguZmxvb3IocG9zLngpLCBNYXRoLmZsb29yKHBvcy55KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmZsb29yKGUuc3RhZ2VYKSwgTWF0aC5mbG9vcihlLnN0YWdlWSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24ocGF0aCl7IFxuICAgICAgICAgICAgICBpZiggcGF0aCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQYXRoIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgcGxheWVyLnBhdGggPSBwYXRoO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICB9KTtcbiAgIH0pO1xuICAgcmV0dXJuIGVhc3lzdGFyO1xufVxuXG5mdW5jdGlvbiBzZXRFdmVudEhhbmRsZXJzKCkge1xuICAgc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBvblNvY2tldENvbm5lY3RlZCk7XG4gICBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIG9uU29ja2V0RGlzY29ubmVjdCk7XG4gICBzb2NrZXQub24oXCJuZXcgcGxheWVyXCIsIG9uTmV3UGxheWVyKTtcbiAgIHNvY2tldC5vbihcIm1vdmUgcGxheWVyXCIsIG9uTW92ZVBsYXllcik7XG4gICBzb2NrZXQub24oXCJyZW1vdmUgcGxheWVyXCIsIG9uUmVtb3ZlUGxheWVyKTtcbn07XG5cbmZ1bmN0aW9uIG9uU29ja2V0Q29ubmVjdGVkKCkge1xuICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogQ2xpZW50IGNvbm5lY3RlZCBvbiBwb3J0IDogXCIrZ2FtZXBvcnQpOyBcbiAgIHNvY2tldC5lbWl0KFwibmV3IHBsYXllclwiLCB7ICAgIHg6IHN0YWdlLmNhbnZhcy53aWR0aC8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBzdGFnZS5jYW52YXMuaGVpZ2h0LzIgfSk7XG59XG5cbmZ1bmN0aW9uIG9uU29ja2V0RGlzY29ubmVjdCgpIHtcbiAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IENsaWVudCBkaXNjb25uZWN0ZWQgZnJvbSBwb3J0IDogXCIrZ2FtZXBvcnQpOyAvL0dsb2JhbFxuICAgLy9DbGVhciBhbGwgcmVtb3RlIHBsYXllcnMvZ2FtZSBvYmplY3RzXG5cbiAgIC8vQ2xlYXIgcmVtb3RlIFBsYXllcnNcbiAgIGZvciggaSA9IDA7IGkgPCByZW1vdGVQbGF5ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgIGN1cnJlbnQgPSByZW1vdGVQbGF5ZXJzW2ldO1xuICAgICAgICAgY3VycmVudC5yZW1vdmUoc3RhZ2UpO1xuICAgfVxuICAgcmVtb3RlUGxheWVycyA9IFtdO1xuXG59XG5cbmZ1bmN0aW9uIG9uTmV3UGxheWVyKGRhdGEpIHtcbiAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IE5ldyBwbGF5ZXIgXCIrZGF0YS5pZCtcImNvbm5lY3RlZCBvbiBwb3J0IDogXCIrZ2FtZXBvcnQpO1xuXG4gICBcbiAgIHZhciBuZXdQbGF5ZXIgPSBuZXcgUGxheWVyKHt4OiBkYXRhLngsIHk6IGRhdGEueX0pOyAvL1RPRE8gcmV3cml0ZSBwbGF5ZXIgXG5cbiAgIG5ld1BsYXllci5pZCA9IGRhdGEuaWQ7XG4gICBuZXdQbGF5ZXIuYWRkKHN0YWdlKTsgLy9zdGFnZSA9IGN1cnJlbnQgc3RhZ2UgZ2xvYmFsXG4gICByZW1vdGVQbGF5ZXJzLnB1c2gobmV3UGxheWVyKTtcblxufVxuXG5mdW5jdGlvbiBvbk1vdmVQbGF5ZXIoZGF0YSkge1xuICAgdmFyIG1vdmVQbGF5ZXIgPSBwbGF5ZXJCeUlkKGRhdGEuaWQpO1xuXG4gICBpZighbW92ZVBsYXllcikge1xuICAgICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogUGxheWVyIG5vdCBmb3VuZDogXCIgKyBkYXRhLmlkKTtcbiAgICAgIHJldHVybjtcbiAgIH1cblxuICAgbW92ZVBsYXllci5zZXRQb3Moe3g6IGRhdGEueCwgeTogZGF0YS55fSk7XG59XG5cbmZ1bmN0aW9uIG9uUmVtb3ZlUGxheWVyKGRhdGEpIHtcbiAgIHZhciByZW1vdmVQbGF5ZXIgPSBwbGF5ZXJCeUlkKGRhdGEuaWQpO1xuXG4gICBpZighcmVtb3ZlUGxheWVyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkNsaWVudCA6OiBQbGF5ZXIgbm90IGZvdW5kOiBcIitkYXRhLmlkKTtcbiAgICAgIHJldHVybjtcbiAgIH07XG5cbiAgIC8vUmVtb3ZlIHRoZSBwbGF5ZXIgZnJvbSByZW1vdGVwbGF5ZXJzIGFycmF5XG4gICByZW1vdmVQbGF5ZXIucmVtb3ZlKHN0YWdlKTsgLy9HbG9iYWwgc3RhZ2VcbiAgIHJlbW90ZVBsYXllcnMuc3BsaWNlKHJlbW90ZVBsYXllcnMuaW5kZXhPZihyZW1vdmVQbGF5ZXIpLDEpO1xufVxuXG4vLyBNdWx0aXBsYXllciBIZWxwZXIgRnVuY3Rpb25zIFxuZnVuY3Rpb24gcGxheWVyQnlJZChpZCl7XG4gICB2YXIgaSA7XG4gICBmb3IoIGkgPSAwOyBpIDwgcmVtb3RlUGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYocmVtb3RlUGxheWVyc1tpXS5pZCA9PSBpZClcbiAgICAgICAgICAgIHJldHVybiByZW1vdGVQbGF5ZXJzW2ldO1xuICAgfTtcblxuICAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbiJdfQ==
