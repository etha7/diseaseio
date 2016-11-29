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

   //Prevent scrolling
   this.stick.getEaselShape().on("mousedown", function(e){
   });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInB1YmxpYy9qcy9DbGFzc2VzLmpzIiwicHVibGljL2pzL21haW5HYW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLy9VdGlsaXR5IGZ1bmN0aW9uczotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy9VdGlsaXR5IGZ1bmN0aW9uIGZvciBjb21wYXJpbmcgYXJyYXlzIGZvciBlcXVhbGl0eVxuQXJyYXkucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKCBhcnJheSApIHtcbiAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGFycmF5Lmxlbmd0aCAmJiBcbiAgICAgICAgICAgdGhpcy5ldmVyeSggZnVuY3Rpb24odGhpc19pLGkpIHsgcmV0dXJuIHRoaXNfaSA9PSBhcnJheVtpXSB9ICkgIFxufVxuXG5cbi8vVXRpbGl0eSBmdW5jdGlvbnM6Xl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXG5cblxuLy9DbGFzcyBkZWZpbml0aW9uczotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy9CYXNlIGNsYXNzIGZvciBhbGwgcHJpbWl0aXZlIG9iamVjdHMgdGhhdCBnZXQgZHJhd25cbmZ1bmN0aW9uIEVhc2VsT2JqZWN0KCBwb3MsIGNvbG9yKXtcblxuICAgdGhpcy5lYXNlbFNoYXBlID0gbmV3IGNyZWF0ZWpzLlNoYXBlKCk7XG4gICB0aGlzLmdldEVhc2VsU2hhcGUgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5lYXNlbFNoYXBlOyB9O1xuXG4gICAvL1NldCBpbml0aWFsIHBvc2l0aW9uXG4gICB0aGlzLmVhc2VsU2hhcGUueCA9IHBvcy54O1xuICAgdGhpcy5lYXNlbFNoYXBlLnkgPSBwb3MueTtcblxuICAgLy9Qb3NpdGlvbiBzZXR0ZXJzIGFuZCBnZXR0ZXJzXG4gICB0aGlzLmdldFBvcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4ge3g6IHRoaXMuZ2V0RWFzZWxTaGFwZSgpLngsIHk6IHRoaXMuZ2V0RWFzZWxTaGFwZSgpLnl9OyB9O1xuICAgdGhpcy5zZXRQb3MgPSBmdW5jdGlvbihwb3MpIHsgdGhpcy5nZXRFYXNlbFNoYXBlKCkueCA9IHBvcy54OyB0aGlzLmdldEVhc2VsU2hhcGUoKS55ID0gcG9zLnk7fTtcblxuICAgLy9UaGUgb2JqZWN0J3MgY29sb3JcbiAgIHRoaXMuY29sb3IgPSBjb2xvcjtcblxuICAgLy9BZGRzIHRoZSBjdXJyZW50IG9iamVjdCB0byB0aGUgc3RhZ2VcbiAgIHRoaXMuYWRkID0gZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHN0YWdlLmFkZENoaWxkKHRoaXMuZ2V0RWFzZWxTaGFwZSgpKTtcbiAgICAgIHN0YWdlLnVwZGF0ZSgpO1xuICAgfTtcblxuICAgLy9SZW1vdmVzIHRoZSBjdXJyZW50IG9iamVjdCBmcm9tIHRoZSBzdGFnZVxuICAgdGhpcy5yZW1vdmUgPSBmdW5jdGlvbihzdGFnZSkge1xuICAgICAgc3RhZ2UucmVtb3ZlQ2hpbGQodGhpcy5nZXRFYXNlbFNoYXBlKCkpO1xuICAgfTtcbn1cblxuLy9BIGNsYXNzIGZvciByZXByZXNlbnRpbmcgY2lyY2xlc1xuZnVuY3Rpb24gQ2lyY2xlKHBvcywgY29sb3IsIHJhZGl1cyApe1xuICAgLy9DYWxsIGNvbnN0cnVjdG9yIG9mIHN1cGVyY2xhc3NcbiAgIEVhc2VsT2JqZWN0LmNhbGwodGhpcywgcG9zLCBjb2xvcik7ICBcblxuICAgLy9TZXQgdGhlIG5ldyByYWRpdXNcbiAgIHRoaXMucmFkaXVzID0gcmFkaXVzO1xuXG4gICAvL0Z1bmN0aW9uOiBkcmF3IGEgY2lyY2xlXG4gICB0aGlzLmRyYXcgPSBmdW5jdGlvbigpe1xuICAgICAgdGhpcy5lYXNlbFNoYXBlLmdyYXBoaWNzLmNsZWFyKCk7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3MuYmVnaW5GaWxsKHRoaXMuY29sb3IpLmRyYXdDaXJjbGUoMCwwLHRoaXMucmFkaXVzKTtcbiAgIH1cblxuICAgLy9GdW5jdGlvbjogZHJhdyBhIGRvdHRlZCBjaXJjbGVcbiAgIHRoaXMuZHJhd0RvdHRlZCA9IGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3MuY2xlYXIoKTtcblxuICAgICAgLy8yMCBwaXhlbCBsaW5lcyB3aXRoIDUgcGl4ZWwgZ2Fwc1xuICAgICAgLy90aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3Muc2V0U3Ryb2tlRGFzaChbMjAsNV0pO1xuICAgICAgdGhpcy5lYXNlbFNoYXBlLmdyYXBoaWNzLnNldFN0cm9rZVN0eWxlKDIpLmJlZ2luU3Ryb2tlKHRoaXMuY29sb3IpLmRyYXdDaXJjbGUoMCwwLHRoaXMucmFkaXVzKTtcbiAgIH1cbiAgICBcbiAgIHRoaXMuZHJhdygpO1xufVxuXG5mdW5jdGlvbiBSZWN0YW5nbGUocG9zLCBjb2xvciwgd2lkdGgsIGhlaWdodCl7XG4gICBFYXNlbE9iamVjdC5jYWxsKHRoaXMsIHBvcywgY29sb3IpO1xuXG4gICB0aGlzLndpZHRoICA9IHdpZHRoO1xuICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblxuICAgLy9FYXNlbC5qcyBkcmF3cyByZWN0YW5nbGVzIHVzaW5nIGNvb3JkaW5hdGVzIHJlcHJlc2VudGluZyB0aGUgcmVjdGFuZ2xlJ3MgdXBwZXIgbGVmdCBjb3JuZXJcbiAgIC8vVGhlIHBvc2l0aW9uIG9mZnNldHMgaGVyZSBkcmF3IHRoZSByZWN0YW5nbGUgc3VjaCB0aGF0IHBvcyByZXByZXNlbnRzIHRoZSBjZW50ZXIgaWYgaXQuIFxuICAgdGhpcy5lYXNlbFNoYXBlLnggLT0gIHRoaXMud2lkdGgvMlxuICAgdGhpcy5lYXNlbFNoYXBlLnkgLT0gIHRoaXMuaGVpZ2h0LzJcbiAgIFxuICAgLy9EcmF3IHRoZSByZWN0YW5nbGVcbiAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgIHRoaXMuZ2V0RWFzZWxTaGFwZSgpLmdyYXBoaWNzLmJlZ2luRmlsbCh0aGlzLmNvbG9yKS5kcmF3UmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICB9XG4gICB0aGlzLmRyYXcoKTtcblxufVxuXG5mdW5jdGlvbiBSZXNvdXJjZSh2YWx1ZSl7XG4gICBDaXJjbGUuY2FsbCh0aGlzLCB7eDogMCwgeTogMH0sIFwid2hpdGVcIiwgMTApO1xuICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBEaXNlYXNlWm9uZShwbGF5ZXJQb3Mpe1xuICAgQ2lyY2xlLmNhbGwodGhpcywgcGxheWVyUG9zLCBcInJlZFwiLCA3NSk7XG4gICB0aGlzLmRyYXdEb3R0ZWQoKTtcbiAgIHRoaXMuQWxsb3dzVGVhbXMgPSBmYWxzZTtcblxuICAgLy9JbnZlcnRzIHdoZXRoZXIgdGhlIGRpc2Vhc2Vab25lIGFsbG93cyB0ZWFtc1xuICAgLy9UT0RPIG1ha2UgcHJvcGVydHkgb2YgcGxheWVyXG4gICB0aGlzLmludmVydEFsbG93c1RlYW1zID0gZnVuY3Rpb24oKXtcblxuICAgICAvL1NldCB0byBub3QgYWxsb3cgdGVhbXNcbiAgICAgaWYodGhpcy5BbGxvd3NUZWFtcyA9PT0gdHJ1ZSl7XG4gICAgICAgIHRoaXMuY29sb3IgPSBcInJlZFwiO1xuICAgICAgICB0aGlzLmRyYXdEb3R0ZWQoKTtcbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IFwiZ3JlZW5cIjtcbiAgICAgICAgdGhpcy5kcmF3RG90dGVkKCk7XG4gICAgIH1cbiAgICAgdGhpcy5BbGxvd3NUZWFtcyA9ICF0aGlzLkFsbG93c1RlYW1zO1xuICAgfTtcbiAgIFxufVxuXG5mdW5jdGlvbiBDYW1lcmEocG9zLCB3aWR0aCwgaGVpZ2h0KXtcbiAgIHRoaXMucG9zID0gcG9zO1xuICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICB0aGlzLmdldFBvcyA9IGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMucG9zO307XG4gICB0aGlzLnNldFBvcyA9IGZ1bmN0aW9uKHBvcykge3RoaXMucG9zID0gcG9zO307XG4gICB0aGlzLmdldFdpZHRoID0gZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy53aWR0aDt9O1xuICAgdGhpcy5zZXRXaWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7dGhpcy53aWR0aCA9IHdpZHRoO307XG4gICB0aGlzLmdldEhlaWdodCA9IGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuaGVpZ2h0O307XG4gICB0aGlzLnNldEhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge3RoaXMuaGVpZ2h0ID0gaGVpZ2h0O307XG59XG5cbmZ1bmN0aW9uIFBsYXllcihwb3Mpe1xuICAgQ2lyY2xlLmNhbGwoIHRoaXMsIHBvcywgXCJyZWRcIiwgMjApO1xuICAgIC8ve3g6IGNhbnZhcy53aWR0aC8yLCB5OiBjYW52YXMuaGVpZ2h0LzJ9LCBcInJlZFwiLCAyMCk7XG4gICBcblxuICAgdGhpcy5pZDtcbiAgIHRoaXMuZGlzZWFzZVpvbmUgPSBuZXcgRGlzZWFzZVpvbmUodGhpcy5nZXRQb3MoKSk7XG4gICB0aGlzLnJlc291cmNlcyA9IDA7XG4gICB0aGlzLmNhbWVyYSA9IHt9O1xuICAgdGhpcy5wYXRoID0gW107XG5cbiAgIC8vdGhpcy5nZXRDYW1lcmEgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5jYW1lcmE7fTtcbiAgIC8vdGhpcy5zZXRDYW1lcmEgPSBmdW5jdGlvbihjYW1lcmEpeyB0aGlzLmNhbWVyYSA9IGNhbWVyYTsgfTtcbiAgIFxuICAgLy9Nb3ZlcyB0aGUgcGxheWVyIGFsb25nIGEgcGF0aCBkZXRlcm1pbmVkIGJ5IEEqIGFsZ29yaXRobVxuICAgdGhpcy5nb1BhdGggPSBmdW5jdGlvbihkZWx0YVRpbWUpe1xuICAgICAgXG4gICAgICBpZih0aGlzLnBhdGguZXF1YWxzKFtdKSA9PT0gZmFsc2UpXG4gICAgICB7XG4gICAgICAgICB2YXIgcG9zID0ge3g6IHRoaXMucGF0aFswXS54LCB5OiB0aGlzLnBhdGhbMF0ueX07XG4gICAgICAgICB0aGlzLnNldFBvcyhwb3MpO1xuICAgICAgICAgdGhpcy5wYXRoLnNwbGljZSgwLCAxKmRlbHRhVGltZSk7IC8vUmVtb3ZlIGRlbHRhVGltZSBlbGVtZW50cyBzdGFydGluZyBmcm9tIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2VsZW1lbnQgMDtcbiAgICAgICAgIHJldHVybiBwb3M7XG4gICAgICB9XG4gICAgIHZhciBwb3MgPSB7eDogdGhpcy5nZXRQb3MoKS54LCB5OiB0aGlzLmdldFBvcygpLnl9OyBcbiAgICAgIHJldHVybiBwb3M7XG4gICB9XG5cbiAgIHRoaXMuZ2V0UmVzb3VyY2VzID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMucmVzb3VyY2VzO307XG4gICB0aGlzLnNldFJlc291cmNlcyA9IGZ1bmN0aW9uKG5ld1Jlc291cmNlcyl7IHRoaXMucmVzb3VyY2VzID0gbmV3UmVzb3VyY2VzfTtcblxuICAgLy9PdmVycmlkZSBpbmhlcml0ZWQgc2V0UG9zXG4gICB2YXIgcGFyZW50U2V0UG9zID0gdGhpcy5zZXRQb3M7XG4gICB0aGlzLnNldFBvcyA9IGZ1bmN0aW9uKHBvcyl7IFxuICAgICAgIC8vdGhpcy5jYW1lcmEuc2V0UG9zKHBvcyk7XG4gICAgICAgdGhpcy5kaXNlYXNlWm9uZS5zZXRQb3MocG9zKTtcbiAgICAgICBwYXJlbnRTZXRQb3MuY2FsbCh0aGlzLCBwb3MpOyAvL25lZWQgY2FsbCBzbyAndGhpcycgaXMgZGVmaW5lZCBhcyB0aGUgY3VycmVudCBQbGF5ZXJcbiAgIH07XG4gICB0aGlzLnNldFBvcyhwb3MpO1xuXG4gICAvL092ZXJyaWRlIGluaGVyaXRlZCBhZGRcbiAgIHZhciBwYXJlbnRBZGQgPSB0aGlzLmFkZDtcbiAgIHRoaXMuYWRkID0gZnVuY3Rpb24oc3RhZ2Upe1xuICAgICAgdGhpcy5kaXNlYXNlWm9uZS5hZGQoc3RhZ2UpO1xuICAgICAgcGFyZW50QWRkLmNhbGwodGhpcywgc3RhZ2UpO1xuICAgfVxuXG4gICB2YXIgcGFyZW50UmVtb3ZlID0gdGhpcy5yZW1vdmU7XG4gICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKHN0YWdlKXtcbiAgICAgIHRoaXMuZGlzZWFzZVpvbmUucmVtb3ZlKHN0YWdlKTtcbiAgICAgIHBhcmVudFJlbW92ZS5jYWxsKHRoaXMsIHN0YWdlKTtcbiAgIH1cbiAgICAgIFxuICAgLy9DaGVjayBpZiBzdGFuZGluZyBvbiBhbnkgcmVzb3VyY2VzXG4gICB0aGlzLnBpY2t1cCA9IGZ1bmN0aW9uKHN0YWdlLCByZXNvdXJjZXMpe1xuICAgICAgdmFyIGVhc2VsU2hhcGUgPSB0aGlzLmdldEVhc2VsU2hhcGUoKTtcbiAgICAgIHZhciByZXNvdXJjZUNvcHkgPSByZXNvdXJjZXMuc2xpY2UoMCxyZXNvdXJjZXMubGVuZ3RoKTtcbiAgICAgIC8vZm9yICh2YXIgeCBvZiByZXNvdXJjZUNvcHkpe1xuICAgICAgZm9yKCBpID0gMDsgaSA8IHJlc291cmNlQ29weS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICB2YXIgeCA9IHJlc291cmNlQ29weVtpXTsgLy9jdXJyZW50IHJlc291cmNlXG5cbiAgICAgICAgIHZhciBwb3MgPSB4LmdldFBvcygpO1xuICAgICAgICAgdmFyIHB0ID0gIGVhc2VsU2hhcGUuZ2xvYmFsVG9Mb2NhbChwb3MueCwgcG9zLnkpOyAvL2hpdFRlc3QgbmVlZHMgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gZWFzZWxTaGFwZVxuICAgICAgICAgaWYoZWFzZWxTaGFwZS5oaXRUZXN0KHB0LngsIHB0LnkpKSAvL0lmIHBsYXllciBpcyBvdmVyIHJlc291cmNlXG4gICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnNldFJlc291cmNlcyh0aGlzLmdldFJlc291cmNlcygpICsgeC52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgcmVtSW5kZXggPSByZXNvdXJjZXMuaW5kZXhPZih4KTtcbiAgICAgICAgICAgIHJlc291cmNlcy5zcGxpY2UocmVtSW5kZXgsMSk7XG4gICAgICAgICAgICB4LnJlbW92ZShzdGFnZSk7XG4gICAgICAgICB9XG4gICAgICB9XG4gICB9XG59XG5cbi8vQ29udHJvbHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vQ3JlYXRlcyBhIEpveXN0aWNrIGF0IHRoZSBnaXZlbiBsb2NhdGlvblxuZnVuY3Rpb24gSm95c3RpY2socG9zLCBwbGF5ZXIpe1xuXG4gICB0aGlzLnBvcyA9IHBvcztcbiAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuXG4gICB0aGlzLmJhc2VTaXplID0gMzU7XG4gICB0aGlzLmJhc2VDb2xvciA9IFwiZ3JleVwiO1xuICAgdGhpcy5iYXNlID0gbmV3IENpcmNsZSh0aGlzLnBvcywgdGhpcy5iYXNlQ29sb3IsIHRoaXMuYmFzZVNpemUpO1xuXG4gICB0aGlzLnN0aWNrU2l6ZSA9IDI1O1xuICAgdGhpcy5zdGlja0NvbG9yID0gXCJ3aGl0ZVwiO1xuICAgdGhpcy5zdGljayA9ICBuZXcgQ2lyY2xlKHRoaXMucG9zLCB0aGlzLnN0aWNrQ29sb3IsIHRoaXMuc3RpY2tTaXplKTtcblxuICAgLy9QcmV2ZW50IHNjcm9sbGluZ1xuICAgdGhpcy5zdGljay5nZXRFYXNlbFNoYXBlKCkub24oXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZSl7XG4gICB9KTtcblxuICAgLy9MaW1pdGVkIERyYWdnaW5nXG4gICB0aGlzLnN0aWNrLmdldEVhc2VsU2hhcGUoKS5vbihcInByZXNzbW92ZVwiLCBmdW5jdGlvbihlKXtcbiAgICAgIGUudGFyZ2V0LnggPSBlLnN0YWdlWDsgLy8oc3RhZ2VYLCBzdGFnZVkpID0gbW91c2VDb29yZGluYXRlXG4gICAgICBlLnRhcmdldC55ID0gZS5zdGFnZVk7XG4gICB9KTtcbiAgIFxuICAgdmFyIGJhc2VWYXIgPSB0aGlzLmJhc2U7IC8vTm8gaWRlYSB3aHkgSSBoYXZlIHRvIGRvIHRoaXM7IHNjb3Bpbmc/XG4gICAvL1Jlc2V0IHN0aWNrIHRvIGJhc2UgcG90aXRpb24gb24gd2hlbiBqb3lzdGljayBpcyByZWxlYXNlZFxuICAgdGhpcy5zdGljay5nZXRFYXNlbFNoYXBlKCkub24oXCJwcmVzc3VwXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgZS50YXJnZXQueCA9IGJhc2VWYXIuZ2V0UG9zKCkueDsgIFxuICAgICAgZS50YXJnZXQueSA9IGJhc2VWYXIuZ2V0UG9zKCkueTtcbiAgIH0pO1xuICAgXG4gICB0aGlzLmdldFBvcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5iYXNlLmdldFBvcygpfTtcbiAgIHRoaXMuc2V0UG9zID0gZnVuY3Rpb24ocG9zKSB7XG4gICAgICB0aGlzLmJhc2Uuc2V0UG9zKHBvcyk7XG4gICAgICB0aGlzLnN0aWNrLnNldFBvcyhwb3MpO1xuICAgfVxuXG4gICAvL0dldCB0aGUgZGlyZWN0aW9uIHRoZSBqb3lzdGljayBpcyBwb2ludGluZ1xuICAgdGhpcy5nZXREaXJlY3Rpb24gPSBmdW5jdGlvbigpe1xuICAgICAgdmFyIHYgPSB0aGlzLnN0aWNrLmdldFBvcygpO1xuICAgICAgdmFyIHcgPSB0aGlzLmJhc2UuZ2V0UG9zKCk7XG4gICAgICB2YXIgeDEgPSB2LnggLSB3Lng7IC8vbmV3IGNvb3JkaW5hdGVzXG4gICAgICB2YXIgeTEgPSB2LnkgLSB3Lnk7XG4gICAgICB2YXIgbWFnMSA9IE1hdGguc3FydCh4MSp4MSArIHkxKnkxKTtcblxuICAgICAgcmV0dXJuIHt4OiB4MS9tYWcxLCB5OiB5MS9tYWcxfVxuICAgfTtcblxuICAgLy9HZXQgdGhlIGZvcmNlIGFjdGluZyBvbiBhIHBsYXllciBieSB0aGUgam95c3RpY2tcbiAgIHRoaXMuZ2V0Rm9yY2UgPSBmdW5jdGlvbigpe1xuICAgICAgdmFyIHYgPSB0aGlzLnN0aWNrLmdldFBvcygpO1xuICAgICAgdmFyIHcgPSB0aGlzLmJhc2UuZ2V0UG9zKCk7XG4gICAgICByZXR1cm4gTWF0aC5hYnMoTWF0aC5zcXJ0KHYueCp2LnggKyB2Lnkqdi55KSAtIE1hdGguc3FydCh3Lngqdy54ICsgdy55KncueSkpO1xuICAgfTtcblxuXG4gICAvL1VwZGF0ZSBwbGF5ZXIncyBsb2NhdGlvbiB3aXRoIHJlc3BlY3QgdG8gam95c3RpY2tcbiAgIHRoaXMubW92ZSA9IGZ1bmN0aW9uIChkZWx0YSkgeyAvL0RlbHRhIGlzIGRlbHRhVGltZVxuXG4gICAgICAvL01vdmUgcGxheWVyIHdpdGggbGVmdCBqb3lzdGlja1xuICAgICAgdmFyIHBsYXllclBvcyA9IHRoaXMucGxheWVyLmdldFBvcygpO1xuICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG5cbiAgICAgIC8vVE9ETyBtYWtlIGRhbXBpbmcgcGxheWVyIHByb3BlcnR5XG4gICAgICB2YXIgZGFtcGluZyA9IDEvMjA7XG4gICAgICBpZihpc05hTihkaXJlY3Rpb24ueCkgfHwgaXNOYU4oZGlyZWN0aW9uLnkpKVxuICAgICAge1xuICAgICAgICAgZGlyZWN0aW9uLnggPSAwO1xuICAgICAgICAgZGlyZWN0aW9uLnkgPSAwO1xuICAgICAgfVxuICAgICAgcGxheWVyUG9zLnggKz0gZGFtcGluZypkZWx0YSp0aGlzLmdldEZvcmNlKCkqZGlyZWN0aW9uLng7XG4gICAgICBwbGF5ZXJQb3MueSArPSBkYW1waW5nKmRlbHRhKnRoaXMuZ2V0Rm9yY2UoKSpkaXJlY3Rpb24ueTtcbiAgICAgIHRoaXMucGxheWVyLnNldFBvcyhwbGF5ZXJQb3MpO1xuXG4gICB9O1xuXG5cbiAgIHRoaXMuYWRkID0gZnVuY3Rpb24oc3RhZ2Upe1xuICAgICAgc3RhZ2UuYWRkQ2hpbGQodGhpcy5iYXNlLmdldEVhc2VsU2hhcGUoKSk7XG4gICAgICBzdGFnZS5hZGRDaGlsZCh0aGlzLnN0aWNrLmdldEVhc2VsU2hhcGUoKSk7XG4gICAgICBzdGFnZS51cGRhdGUoKTtcbiAgIH1cblxufVxuXG4vL0J1dHRvbiBmb3Igb3B0aW5nIGluIG9yIG91dCBvZiB0ZWFtc1xuZnVuY3Rpb24gVGVhbUJ1dHRvbihwb3MsIGNvbG9yLCBwbGF5ZXIpe1xuXG4gICAvL1RPRE8gbWFrZSBiYXNlU2l6ZSBzb21lIGtpbmQgb2YgZ2xvYmFsIHZhcmlhYmxlXG4gICB2YXIgYmFzZVNpemUgPSAzNTtcbiAgIENpcmNsZS5jYWxsKHRoaXMsIHBvcywgY29sb3IsIGJhc2VTaXplKTtcblxuICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cbiAgIHRoaXMuZ2V0RWFzZWxTaGFwZSgpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZSl7XG4gICAgICBwbGF5ZXIuZGlzZWFzZVpvbmUuaW52ZXJ0QWxsb3dzVGVhbXMoKTtcbiAgIH0pO1xufVxuLy9Db250cm9scyBeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cblxuLy9EcmFnYWJsZSBDbGFzczogTWFrZXMgb2JqZWN0cyBEcmFnYWJsZVxuZnVuY3Rpb24gRHJhZ2FibGUocG9zLCBjb2xvcil7XG5cbiAgIC8vQ2FsbCBzdXBlcmNsYXNzJ3MgY29uc3RydWN0b3JcbiAgIEVhc2VsT2JqZWN0LmNhbGwodGhpcywgcG9zLCBjb2xvcik7XG5cbiAgIC8vVXBkYXRlIGNvb3JkaW5hdGVzIHdoaWxlIG9iamVjdCBpcyBtb3ZlZCB3aGlsZSBwcmVzc2VkXG4gICB0aGlzLmdldEVhc2VsU2hhcGUoKS5vbihcInByZXNzbW92ZVwiLCBmdW5jdGlvbihlKXtcbiAgICAgIGUudGFyZ2V0LnggPSBlLnN0YWdlWDsgLy8oc3RhZ2VYLCBzdGFnZVkpID0gbW91c2VDb29yZGluYXRlXG4gICAgICBlLnRhcmdldC55ID0gZS5zdGFnZVk7XG4gICB9KTtcblxufTtcblxuXG5cblxuLy9DbGFzcyBkZWZpbml0aW9uczpeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cbmV4cG9ydHMuRWFzZWxPYmplY3QgPSBFYXNlbE9iamVjdDtcbmV4cG9ydHMuQ2lyY2xlICAgICAgPSBDaXJjbGU7XG5leHBvcnRzLlJlY3RhbmdsZSAgID0gUmVjdGFuZ2xlO1xuZXhwb3J0cy5SZXNvdXJjZSAgICA9IFJlc291cmNlO1xuZXhwb3J0cy5DYW1lcmEgICAgICA9IENhbWVyYTtcbmV4cG9ydHMuRGlzZWFzZVpvbmUgPSBEaXNlYXNlWm9uZTtcbmV4cG9ydHMuUGxheWVyICAgICAgPSBQbGF5ZXI7XG5leHBvcnRzLkpveXN0aWNrICAgID0gSm95c3RpY2s7XG5leHBvcnRzLlRlYW1CdXR0b24gID0gVGVhbUJ1dHRvbjtcbiIsIi8qIElNUE9SVEFOVDogU2V2ZXJhbCB2YXJpYWJsZXMgaW4gdGhpcyBqcywgbGlrZSBcImlvXCIsIGV4aXN0IGJlY2F1c2VcbiAgIG1haW5HYW1lLmpzIGlzIGluY2x1ZGVkIGJlbG93IHNvY2tldC5pby5qcyBpbiB2aWV3cy9jaXRpemVuLmhhbmRsZWJhcnMuXG4gICAgKi9cblxuXG4vKiBJbXBvcnQgY2xhc3NlcyAqL1xuXG4vL1JlcXVpcmluZyBlbmFibGVkIGJ5IGJyb3dzZXJpZnlcblxudmFyIEVhc2VsT2JqZWN0ID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5FYXNlbE9iamVjdDtcbnZhciBDaXJjbGUgICAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuQ2lyY2xlO1xudmFyIFJlY3RhbmdsZSAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5SZWN0YW5nbGU7XG52YXIgUmVzb3VyY2UgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlJlc291cmNlO1xudmFyIENhbWVyYSAgICAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5DYW1lcmE7XG52YXIgRGlzZWFzZVpvbmUgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkRpc2Vhc2Vab25lO1xudmFyIFBsYXllciAgICAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5QbGF5ZXI7XG52YXIgSm95c3RpY2sgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkpveXN0aWNrO1xudmFyIFRlYW1CdXR0b24gID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5UZWFtQnV0dG9uO1xuXG5cbnZhciBnYW1lcG9ydCA9IDgwODA7IC8vcG9ydCBjbGllbnRzIHdpbGwgY29ubmVjdCB0byBcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5DYW52YXNcIik7XG52YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5jYW52YXMud2lkdGggID0gd2luZG93LmlubmVyV2lkdGg7XG5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0OyBcblxudmFyIHN0YWdlICAgICAgICA9IG5ldyBjcmVhdGVqcy5TdGFnZShcIm1haW5DYW52YXNcIik7XG5cbnZhciBwbGF5ZXIsXG4gICAgcmVtb3RlUGxheWVycyxcbiAgICBkZWx0YVRpbWUsXG4gICAgc29ja2V0O1xuXG5tYWluKCk7XG5cblxuZnVuY3Rpb24gbWFpbigpe1xuICAgXG4gICAvL0luaXRpYWxpemUgdGhlIGdhbWUgd29ybGRcbiAgIHZhciB3b3JsZCAgICAgICAgPSBpbml0V29ybGQoKTtcbiAgIHZhciBiYWNrZ3JvdW5kICAgPSBpbml0QmFja2dyb3VuZChzdGFnZSwgY2FudmFzKTtcblxuICAgXG4gICAvL0luaXRhbGl6ZSB0aGUgZ2FtZSBjb250cm9scyBhbmQgcGxheWVyXG4gICBwbGF5ZXIgICAgICAgICAgID0gaW5pdFBsYXllcihzdGFnZSk7XG4gICAvL3BsYXllci5zZXRDYW1lcmEobmV3IENhbWVyYShwbGF5ZXIuZ2V0UG9zKCksIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCkpO1xuICAgdmFyIGxlZnRKb3lzdGljayA9IGluaXRKb3lzdGlja3Moc3RhZ2UsIHBsYXllcikubGVmdDtcbiAgIHZhciB0ZWFtQnV0dG9uICAgPSBpbml0VGVhbUJ1dHRvbihzdGFnZSwgcGxheWVyKTtcblxuICAgLy9Jbml0aWFsaXplIGFycmF5IG9mIHJlc291cmNlIG9iamVjdHMgYW5kIHJlc291cmNlIHRleHRcbiAgIHZhciByZXNvdXJjZXMgICAgPSBpbml0UmVzb3VyY2VzKHN0YWdlLCBjYW52YXMpO1xuICAgdmFyIHJlc291cmNlVGV4dCA9IGluaXRSZXNvdXJjZVRleHQoc3RhZ2UsY2FudmFzLCBwbGF5ZXIpO1xuXG4gICAvL0luaXRpYWxpemUgUGF0aGZpbmRpbmdcbiAgIHZhciBlYXN5c3RhciA9IGluaXRQYXRoZmluZGluZyh3b3JsZCwgcGxheWVyLCBiYWNrZ3JvdW5kKTsgXG4gICBcbiAgIC8vRW5hYmxlIHRvdWNoIGJhc2VkIGludGVyZmFjZSBmb3IgbW9iaWxlIGRldmljZXNcbiAgIGNyZWF0ZWpzLlRvdWNoLmVuYWJsZShzdGFnZSk7XG5cbiAgIC8vUmVzaXplIGNhbnZhcyBvbiB3aW5kb3cgcmVzaXplICAgXG4gICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBmdW5jdGlvbigpe1xuICAgICAgc3RhZ2UuY2FudmFzLndpZHRoICA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgc3RhZ2UuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgIGJhY2tncm91bmQud2lkdGggICAgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgIGJhY2tncm91bmQuaGVpZ2h0ICAgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICBiYWNrZ3JvdW5kLmRyYXcoKTtcblxuICAgICAgLy9UT0RPIGVuY2Fwc3VsYXRlIHRoZXNlIG9mZnNldHMgd2l0aGluIEpveXN0aWNrIGFuZCBUZWFtQnV0dG9uXG4gICAgICBsZWZ0Sm95c3RpY2suc2V0UG9zKHt4OiB3aW5kb3cuaW5uZXJXaWR0aC82LCB5OiB3aW5kb3cuaW5uZXJIZWlnaHQvMn0pO1xuICAgICAgdGVhbUJ1dHRvbi5zZXRQb3Moe3g6IHdpbmRvdy5pbm5lcldpZHRoIC0gd2luZG93LmlubmVyV2lkdGgvNiwgeTogd2luZG93LmlubmVySGVpZ2h0LzJ9KTtcblxuXG4gICB9LCBmYWxzZSk7XG4gICBcblxuICAgLyogTXVsdGlwbGF5ZXIgaW5pdGlhbGl6YXRpb24gY29kZSAqL1xuICAgLy9Db25uZWN0IGNsaWVudCB0byBzZXJ2ZXIgXG4gICBzb2NrZXQgPSBpby5jb25uZWN0KCk7XG4gICBcbiAgIC8vSW5pdGlhbGl6ZSByZW1vdGUgcGxheWVycyBcbiAgIHJlbW90ZVBsYXllcnMgPSBbXTtcblxuICAgLy9MaXN0ZW4gZm9yIGV2ZW50c1xuICAgc2V0RXZlbnRIYW5kbGVycygpO1xuXG5cbiAgIC8vTWFpbiBnYW1lIGxvb3AtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICB2YXIgRlBTID0gNTA7XG4gICBjcmVhdGVqcy5UaWNrZXIuc2V0RlBTKEZQUyk7XG4gICB2YXIgcHJldmlvdXNUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgIHZhciBjdXJyZW50VGltZTtcbiAgIC8vIHBpeGVscy9mcmFtZSAqIGZyYW1lcy9zZWNvbmQgPSBwaXhlbHMvc2Vjb25kOiBkZWx0YSB0aW1lIGlzXG4gICAvLyBlbXBpcmljYWwgRlBTXG4gICBjcmVhdGVqcy5UaWNrZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRpY2tcIiwgZnVuY3Rpb24oKXtcblxuICAgICAgLy9Mb2dpYyB0byBjcmVhdGUgZGVsdGFUaW1lIHNvIG1vdmVtZW50IGlzIHJlbGF0aXZlIHRvIHRpbWVcbiAgICAgIC8vcmF0aGVyIHRoYW4gZnJhbWVzLlxuICAgICAgdmFyIHRpbWVyID0gbmV3IERhdGUoKTtcbiAgICAgIGN1cnJlbnRUaW1lID0gdGltZXIuZ2V0VGltZSgpO1xuICAgICAgZGVsdGFUaW1lID0gY3VycmVudFRpbWUgLSBwcmV2aW91c1RpbWU7XG4gICAgICBwcmV2aW91c1RpbWUgPSBjdXJyZW50VGltZTtcblxuICAgICAgLy9EbyBwYXRoZmluZGluZyBjYWxjdWxhdGlvblxuICAgICAgZWFzeXN0YXIuY2FsY3VsYXRlKCk7XG5cbiAgICAgIC8vTW92ZSBwbGF5ZXIgYWNjb3JkaW5nIHRvIGpveXN0aWNrXG4gICAgICBsZWZ0Sm95c3RpY2subW92ZShkZWx0YVRpbWUpO1xuXG4gICAgICAvL0NoZWNrIGlmIHBsYXllciBpcyBjb2xsaWRpbmcgd2l0aCByZXNvdXJjZXNcbiAgICAgIHBsYXllci5waWNrdXAoc3RhZ2UsIHJlc291cmNlcyk7XG5cbiAgICAgIC8vTW92ZSBhbG9uZyBjYWxjdWxhdGVkIHBhdGhmaW5kaW5nIHBhdGhcbiAgICAgIHBhdGhQbGF5ZXJzKHBsYXllcixkZWx0YVRpbWUpO1xuXG4gICAgICAvL1VwZGF0ZSByZXNvdXJjZSB0ZXh0XG4gICAgICByZXNvdXJjZVRleHQudGV4dCA9IFwiUmVzb3VyY2VzOiBcIitwbGF5ZXIuZ2V0UmVzb3VyY2VzKCk7XG5cbiAgICAgIC8vQ29tbWl0IGFsbCB1cGRhdGVzIHRvIGFjdHVhbCBzdGFnZS9jYW52YXNcbiAgICAgIHN0YWdlLnVwZGF0ZSgpO1xuXG4gICB9KTtcblxufVxuLy9VdGlsaXR5IGZ1bmN0aW9uczotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy9VdGlsaXR5IGZ1bmN0aW9uIGZvciBjb21wYXJpbmcgYXJyYXlzIGZvciBlcXVhbGl0eVxuQXJyYXkucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKCBhcnJheSApIHtcbiAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGFycmF5Lmxlbmd0aCAmJiBcbiAgICAgICAgICAgdGhpcy5ldmVyeSggZnVuY3Rpb24odGhpc19pLGkpIHsgcmV0dXJuIHRoaXNfaSA9PSBhcnJheVtpXSB9ICkgIFxufVxuXG5cbi8vVXRpbGl0eSBmdW5jdGlvbnM6Xl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXG5cbmZ1bmN0aW9uIHBhdGhQbGF5ZXJzKHBsYXllcixkZWx0YVRpbWUpe1xuICAgICBcbiAgICAgIHZhciBuZXdQYXRoUG9zO1xuICAgICAgcGxheWVyLmdvUGF0aChkZWx0YVRpbWUpO1xuICAgICAgc29ja2V0LmVtaXQoXCJtb3ZlIHBsYXllclwiLCB7ICB4OiBwbGF5ZXIuZ2V0UG9zKCkueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBsYXllci5nZXRQb3MoKS55IH0pO1xuICAgICAgZm9yKGkgPSAwOyBpIDwgcmVtb3RlUGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgY3VyclBsYXllciA9IHJlbW90ZVBsYXllcnNbaV07XG4gICAgICAgICBuZXdQYXRoUG9zID0gY3VyclBsYXllci5nb1BhdGgoZGVsdGFUaW1lKTtcblxuICAgICAgICAgLy9FYWNoIHBsYXllciBhbHJlYWR5IHVwZGF0ZXMgdGhlaXIgb3duIHBvc2l0aW9uIG9uIHRoZSBzZXJ2ZXIsXG4gICAgICAgICAvL3RoaXMgY2FsbCBpcyB1bmVjZXNzYXJ5XG4gICAgICAgICAvKnNvY2tldC5lbWl0KFwibW92ZSBwbGF5ZXJcIiwgeyAgeDogbmV3UGF0aFBvcy54XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBuZXdQYXRoUG9zLnkgfSk7Ki9cbiAgICAgIH1cbn1cblxuLy9DcmVhdGVzIGEgc3F1YXJlIHdvcmxkIG9mIHNpemUgMTAwMCB0aGF0IG91ciBwYXRoZmluZGluZyBhbGdvcml0aG0gY2FuIHVzZVxuZnVuY3Rpb24gaW5pdFdvcmxkKCl7XG4gLy9UT0RPIG1ha2Ugc2l6ZSBvZiBjYW52YXMsIHJlc2l6ZSB3aXRoIGNhbnZhc1xuICAgdmFyIHNpemUgPSAxMDAwO1xuICAgdmFyIHdvcmxkID0gW11cbiAgIGZvcih2YXIgaSA9IDA7IGkgPCBzaXplOyBpKyspe1xuICAgICAgd29ybGRbaV0gPSBbXVxuICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHNpemU7IGorKyl7XG4gICAgICAgICB3b3JsZFtpXVtqXSA9MDtcbiAgICAgIH1cbiAgIH1cbiAgIHJldHVybiB3b3JsZDtcbn1cblxuLy9DcmVhdGVzIGFuZCBkaXNwbGF5ZXMgdGhlIFJlc291cmNlczogeCB0ZXh0XG5mdW5jdGlvbiBpbml0UmVzb3VyY2VUZXh0KHN0YWdlLCBjYW52YXMsIHBsYXllcil7XG4gICByZXNvdXJjZVRleHQgPSBuZXcgY3JlYXRlanMuVGV4dChcIlJlc291cmNlczogXCIrcGxheWVyLmdldFJlc291cmNlcygpLCBcIjIwcHggQXJpYWxcIiwgXCJ3aGl0ZVwiKTtcbiAgIHJlc291cmNlVGV4dC54ID0gMDtcbiAgIHJlc291cmNlVGV4dC55ID0gY2FudmFzLmhlaWdodC8xMjsgLy9UT0RPIG1vcmUgbG9naWNhbGx5IHBvc2l0aW9uIFJlc291cmNlcyB0ZXh0XG4gICByZXNvdXJjZVRleHQudGV4dEJhc2VsaW5lID0gXCJhbHBoYWJldFwiOyAvL05vdCBzdXJlIHdoYXQgdGhpcyBzZXR0aW5nIGRvZXNcbiAgIHN0YWdlLmFkZENoaWxkKHJlc291cmNlVGV4dCk7XG4gICByZXR1cm4gcmVzb3VyY2VUZXh0O1xuXG59XG5cbi8vQ3JlYXRlcyBhbiBhcnJheSBvZiByYW5kb21seSBwbGFjZWQgUmVzb3VyY2VzIG9uIHRoZSBzdGFnZVxuZnVuY3Rpb24gaW5pdFJlc291cmNlcyhzdGFnZSwgY2FudmFzKXtcblxuICAgdmFyIG51bVJlc291cmNlcyA9IDM7IC8vVE9ETyBtYWtlIGdsb2JhbC9tYWtlIGxvZ2ljYWwgY2hvaWNlLiBUb28gaGlnaCBhIG51bWJlciBtYXkgaW5jdXIgcmVzb3VyY2UgcHJvYmxlbXNcbiAgIHZhciBjdXJyUG9zID0ge3g6IDAsIHk6IDB9O1xuICAgdmFyIHJlc291cmNlcyA9IFtdO1xuICAgdmFyIHJlc291cmNlVmFsdWUgPSAxMDtcblxuICAgZm9yIChpID0gMDsgaSA8IG51bVJlc291cmNlczsgaSArKyl7XG4gICAgICBjdXJyUG9zLnggPSBNYXRoLmZsb29yKChNYXRoLnJhbmRvbSgpICogY2FudmFzLndpZHRoKSk7IC8vUmFuZG9tIG51bWJlciBmcm9tIHplcm8gdG8gY2FudmFzLndpZHRoXG4gICAgICBjdXJyUG9zLnkgPSBNYXRoLmZsb29yKChNYXRoLnJhbmRvbSgpICogY2FudmFzLmhlaWdodCkpO1xuXG4gICAgICB2YXIgcmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UocmVzb3VyY2VWYWx1ZSk7XG4gICAgICByZXNvdXJjZS5zZXRQb3MoY3VyclBvcyk7XG4gICAgICByZXNvdXJjZS5hZGQoc3RhZ2UpO1xuICAgICAgcmVzb3VyY2VzLnB1c2gocmVzb3VyY2UpO1xuICAgfVxuXG4gICByZXR1cm4gcmVzb3VyY2VzO1xufVxuXG4vL0NyZWF0ZSBhbiBvYmplY3QgdG8gcmVwcmVzZW50IHRoZSBiYWNrZ3JvdW5kIGFuZCByZWdpc3RlciBwYXRoZmluZGluZyBldmVudHNcbmZ1bmN0aW9uIGluaXRCYWNrZ3JvdW5kKHN0YWdlLCBjYW52YXMpe1xuICAgdmFyIGNvbG9yID0gXCJibGFja1wiO1xuICAgdmFyIHdpZHRoID0gY2FudmFzLndpZHRoO1xuICAgdmFyIGhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgIFxuICAgXG4gICB2YXIgYmFja2dyb3VuZCA9IG5ldyBSZWN0YW5nbGUoIHt4OiB3aWR0aC8yLCB5OiBoZWlnaHQvMn0sIGNvbG9yLCB3aWR0aCwgaGVpZ2h0KTtcbiAgIGJhY2tncm91bmQuYWRkKHN0YWdlKTtcblxuICAgcmV0dXJuIGJhY2tncm91bmQ7XG5cbn1cblxuLy9DcmVhdGUgZGVzaXJlZCBKb3lzdGlja3MgZm9yIHRoZSB1c2VyXG5mdW5jdGlvbiBpbml0Sm95c3RpY2tzKHN0YWdlLCBwbGF5ZXIpe1xuICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpbkNhbnZhc1wiKTtcbiAgIC8vdmFyIHJpZ2h0ICA9IG5ldyBKb3lzdGljayh7eDpjYW52YXMud2lkdGggLSBjYW52YXMud2lkdGgvNiwgeTogY2FudmFzLmhlaWdodC8yfSk7XG4gICB2YXIgbGVmdCA9IG5ldyBKb3lzdGljayh7eDogY2FudmFzLndpZHRoLzYsIHk6IGNhbnZhcy5oZWlnaHQvMn0sIHBsYXllcik7XG5cbiAgIC8vQWRkIHRvIGNhbnZhc1xuICAgLy9yaWdodC5hZGQoc3RhZ2UpO1xuICAgbGVmdC5hZGQoc3RhZ2UpO1xuXG4gICByZXR1cm4ge2xlZnQ6IGxlZnR9O1xufVxuXG4vL0NyZWF0ZXMgYSBwbGF5ZXIgYW5kIGFzc29jaWF0ZXMgaXQgdG8gYSBqb3lzdGlja1xuZnVuY3Rpb24gaW5pdFBsYXllcihzdGFnZSl7XG5cbiAgIC8vSW5pdCBsb2NhbCBwbGF5ZXJcbiAgIHBsYXllciA9IG5ldyBQbGF5ZXIoe3g6IHN0YWdlLmNhbnZhcy53aWR0aC8yLCB5OiBzdGFnZS5jYW52YXMuaGVpZ2h0LzJ9KTtcbiAgIHBsYXllci5hZGQoc3RhZ2UpO1xuXG5cbiAgIHJldHVybiBwbGF5ZXI7XG59XG5cbi8vQ3JlYXRlcyBhIGJ1dHRvbiB0aGF0IGFsbG93cyB1c2VycyB0byBvcHQgaW4gb3Igb3V0IG9mIHRlYW1zXG5mdW5jdGlvbiBpbml0VGVhbUJ1dHRvbihzdGFnZSwgcGxheWVyKXtcblxuICAgLy9QdXQgYnV0dG9uIGF0IHJpZ2h0IG9mIGpveXN0aWNrXG4gICB2YXIgYnV0dG9uUG9zID0ge3g6IHN0YWdlLmNhbnZhcy53aWR0aCAtIHN0YWdlLmNhbnZhcy53aWR0aC82LCB5OiBzdGFnZS5jYW52YXMuaGVpZ2h0LzJ9O1xuICAgdmFyIHRlYW1CdXR0b24gPSBuZXcgVGVhbUJ1dHRvbihidXR0b25Qb3MsIFwiZ3JleVwiLCBwbGF5ZXIpO1xuICAgdGVhbUJ1dHRvbi5hZGQoc3RhZ2UpO1xuXG4gICByZXR1cm4gdGVhbUJ1dHRvbjtcbn1cblxuLy9Jbml0aWFsaXplIEEqIHBhdGhmaW5kaW5nIHdpdGggZWFzeXN0YXIgbGliYXJ5XG5mdW5jdGlvbiBpbml0UGF0aGZpbmRpbmcod29ybGQsIHBsYXllciwgYmFja2dyb3VuZCl7XG5cbiAgIHZhciBlYXN5c3RhciA9IG5ldyBFYXN5U3Rhci5qcygpO1xuICAgZWFzeXN0YXIuc2V0R3JpZCh3b3JsZCk7XG4gICBlYXN5c3Rhci5zZXRBY2NlcHRhYmxlVGlsZXMoWzBdKTsgLy90aWxlcyB3ZSdyZSBhYmxlIHRvIHdhbGsgb25cbiAgIGVhc3lzdGFyLmVuYWJsZURpYWdvbmFscygpOyBcbiAgIFxuICAgLy9HZW5lcmF0ZSBwYXRoIHdoZW4gYmFja2dyb3VuZCBpcyBjbGlja2VkXG4gICBiYWNrZ3JvdW5kLmdldEVhc2VsU2hhcGUoKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgdmFyIHBvcyA9IHBsYXllci5nZXRQb3MoKTtcbiAgICAgICAgIFxuICAgICAgICAgZWFzeXN0YXIuZmluZFBhdGgoTWF0aC5mbG9vcihwb3MueCksIE1hdGguZmxvb3IocG9zLnkpLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoZS5zdGFnZVgpLCBNYXRoLmZsb29yKGUuc3RhZ2VZKSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihwYXRoKXsgXG4gICAgICAgICAgICAgIGlmKCBwYXRoID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBhdGggbm90IGZvdW5kXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICBwbGF5ZXIucGF0aCA9IHBhdGg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuICAgfSk7XG4gICByZXR1cm4gZWFzeXN0YXI7XG59XG5cbmZ1bmN0aW9uIHNldEV2ZW50SGFuZGxlcnMoKSB7XG4gICBzb2NrZXQub24oXCJjb25uZWN0XCIsIG9uU29ja2V0Q29ubmVjdGVkKTtcbiAgIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgb25Tb2NrZXREaXNjb25uZWN0KTtcbiAgIHNvY2tldC5vbihcIm5ldyBwbGF5ZXJcIiwgb25OZXdQbGF5ZXIpO1xuICAgc29ja2V0Lm9uKFwibW92ZSBwbGF5ZXJcIiwgb25Nb3ZlUGxheWVyKTtcbiAgIHNvY2tldC5vbihcInJlbW92ZSBwbGF5ZXJcIiwgb25SZW1vdmVQbGF5ZXIpO1xufTtcblxuZnVuY3Rpb24gb25Tb2NrZXRDb25uZWN0ZWQoKSB7XG4gICBjb25zb2xlLmxvZyhcIkNsaWVudCA6OiBDbGllbnQgY29ubmVjdGVkIG9uIHBvcnQgOiBcIitnYW1lcG9ydCk7IFxuICAgc29ja2V0LmVtaXQoXCJuZXcgcGxheWVyXCIsIHsgICAgeDogc3RhZ2UuY2FudmFzLndpZHRoLzIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHN0YWdlLmNhbnZhcy5oZWlnaHQvMiB9KTtcbn1cblxuZnVuY3Rpb24gb25Tb2NrZXREaXNjb25uZWN0KCkge1xuICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogQ2xpZW50IGRpc2Nvbm5lY3RlZCBmcm9tIHBvcnQgOiBcIitnYW1lcG9ydCk7IC8vR2xvYmFsXG4gICAvL0NsZWFyIGFsbCByZW1vdGUgcGxheWVycy9nYW1lIG9iamVjdHNcblxuICAgLy9DbGVhciByZW1vdGUgUGxheWVyc1xuICAgZm9yKCBpID0gMDsgaSA8IHJlbW90ZVBsYXllcnMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgY3VycmVudCA9IHJlbW90ZVBsYXllcnNbaV07XG4gICAgICAgICBjdXJyZW50LnJlbW92ZShzdGFnZSk7XG4gICB9XG4gICByZW1vdGVQbGF5ZXJzID0gW107XG5cbn1cblxuZnVuY3Rpb24gb25OZXdQbGF5ZXIoZGF0YSkge1xuICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogTmV3IHBsYXllciBcIitkYXRhLmlkK1wiY29ubmVjdGVkIG9uIHBvcnQgOiBcIitnYW1lcG9ydCk7XG5cbiAgIFxuICAgdmFyIG5ld1BsYXllciA9IG5ldyBQbGF5ZXIoe3g6IGRhdGEueCwgeTogZGF0YS55fSk7IC8vVE9ETyByZXdyaXRlIHBsYXllciBcblxuICAgbmV3UGxheWVyLmlkID0gZGF0YS5pZDtcbiAgIG5ld1BsYXllci5hZGQoc3RhZ2UpOyAvL3N0YWdlID0gY3VycmVudCBzdGFnZSBnbG9iYWxcbiAgIHJlbW90ZVBsYXllcnMucHVzaChuZXdQbGF5ZXIpO1xuXG59XG5cbmZ1bmN0aW9uIG9uTW92ZVBsYXllcihkYXRhKSB7XG4gICB2YXIgbW92ZVBsYXllciA9IHBsYXllckJ5SWQoZGF0YS5pZCk7XG5cbiAgIGlmKCFtb3ZlUGxheWVyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkNsaWVudCA6OiBQbGF5ZXIgbm90IGZvdW5kOiBcIiArIGRhdGEuaWQpO1xuICAgICAgcmV0dXJuO1xuICAgfVxuXG4gICBtb3ZlUGxheWVyLnNldFBvcyh7eDogZGF0YS54LCB5OiBkYXRhLnl9KTtcbn1cblxuZnVuY3Rpb24gb25SZW1vdmVQbGF5ZXIoZGF0YSkge1xuICAgdmFyIHJlbW92ZVBsYXllciA9IHBsYXllckJ5SWQoZGF0YS5pZCk7XG5cbiAgIGlmKCFyZW1vdmVQbGF5ZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IFBsYXllciBub3QgZm91bmQ6IFwiK2RhdGEuaWQpO1xuICAgICAgcmV0dXJuO1xuICAgfTtcblxuICAgLy9SZW1vdmUgdGhlIHBsYXllciBmcm9tIHJlbW90ZXBsYXllcnMgYXJyYXlcbiAgIHJlbW92ZVBsYXllci5yZW1vdmUoc3RhZ2UpOyAvL0dsb2JhbCBzdGFnZVxuICAgcmVtb3RlUGxheWVycy5zcGxpY2UocmVtb3RlUGxheWVycy5pbmRleE9mKHJlbW92ZVBsYXllciksMSk7XG59XG5cbi8vIE11bHRpcGxheWVyIEhlbHBlciBGdW5jdGlvbnMgXG5mdW5jdGlvbiBwbGF5ZXJCeUlkKGlkKXtcbiAgIHZhciBpIDtcbiAgIGZvciggaSA9IDA7IGkgPCByZW1vdGVQbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihyZW1vdGVQbGF5ZXJzW2ldLmlkID09IGlkKVxuICAgICAgICAgICAgcmV0dXJuIHJlbW90ZVBsYXllcnNbaV07XG4gICB9O1xuXG4gICByZXR1cm4gZmFsc2U7XG59XG5cblxuIl19
