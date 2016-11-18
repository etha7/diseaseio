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
        e.preventDefault(); 
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInB1YmxpYy9qcy9DbGFzc2VzLmpzIiwicHVibGljL2pzL21haW5HYW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vL1V0aWxpdHkgZnVuY3Rpb25zOi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vL1V0aWxpdHkgZnVuY3Rpb24gZm9yIGNvbXBhcmluZyBhcnJheXMgZm9yIGVxdWFsaXR5XG5BcnJheS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24oIGFycmF5ICkge1xuICByZXR1cm4gdGhpcy5sZW5ndGggPT0gYXJyYXkubGVuZ3RoICYmIFxuICAgICAgICAgICB0aGlzLmV2ZXJ5KCBmdW5jdGlvbih0aGlzX2ksaSkgeyByZXR1cm4gdGhpc19pID09IGFycmF5W2ldIH0gKSAgXG59XG5cblxuLy9VdGlsaXR5IGZ1bmN0aW9uczpeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cblxuXG4vL0NsYXNzIGRlZmluaXRpb25zOi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vL0Jhc2UgY2xhc3MgZm9yIGFsbCBwcmltaXRpdmUgb2JqZWN0cyB0aGF0IGdldCBkcmF3blxuZnVuY3Rpb24gRWFzZWxPYmplY3QoIHBvcywgY29sb3Ipe1xuXG4gICB0aGlzLmVhc2VsU2hhcGUgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgIHRoaXMuZ2V0RWFzZWxTaGFwZSA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVhc2VsU2hhcGU7IH07XG5cbiAgIC8vU2V0IGluaXRpYWwgcG9zaXRpb25cbiAgIHRoaXMuZWFzZWxTaGFwZS54ID0gcG9zLng7XG4gICB0aGlzLmVhc2VsU2hhcGUueSA9IHBvcy55O1xuXG4gICAvL1Bvc2l0aW9uIHNldHRlcnMgYW5kIGdldHRlcnNcbiAgIHRoaXMuZ2V0UG9zID0gZnVuY3Rpb24oKSB7IHJldHVybiB7eDogdGhpcy5nZXRFYXNlbFNoYXBlKCkueCwgeTogdGhpcy5nZXRFYXNlbFNoYXBlKCkueX07IH07XG4gICB0aGlzLnNldFBvcyA9IGZ1bmN0aW9uKHBvcykgeyB0aGlzLmdldEVhc2VsU2hhcGUoKS54ID0gcG9zLng7IHRoaXMuZ2V0RWFzZWxTaGFwZSgpLnkgPSBwb3MueTt9O1xuXG4gICAvL1RoZSBvYmplY3QncyBjb2xvclxuICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuXG4gICAvL0FkZHMgdGhlIGN1cnJlbnQgb2JqZWN0IHRvIHRoZSBzdGFnZVxuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihzdGFnZSkge1xuICAgICAgc3RhZ2UuYWRkQ2hpbGQodGhpcy5nZXRFYXNlbFNoYXBlKCkpO1xuICAgICAgc3RhZ2UudXBkYXRlKCk7XG4gICB9O1xuXG4gICAvL1JlbW92ZXMgdGhlIGN1cnJlbnQgb2JqZWN0IGZyb20gdGhlIHN0YWdlXG4gICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICBzdGFnZS5yZW1vdmVDaGlsZCh0aGlzLmdldEVhc2VsU2hhcGUoKSk7XG4gICB9O1xufVxuXG4vL0EgY2xhc3MgZm9yIHJlcHJlc2VudGluZyBjaXJjbGVzXG5mdW5jdGlvbiBDaXJjbGUocG9zLCBjb2xvciwgcmFkaXVzICl7XG4gICAvL0NhbGwgY29uc3RydWN0b3Igb2Ygc3VwZXJjbGFzc1xuICAgRWFzZWxPYmplY3QuY2FsbCh0aGlzLCBwb3MsIGNvbG9yKTsgIFxuXG4gICAvL1NldCB0aGUgbmV3IHJhZGl1c1xuICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XG5cbiAgIC8vRnVuY3Rpb246IGRyYXcgYSBjaXJjbGVcbiAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5iZWdpbkZpbGwodGhpcy5jb2xvcikuZHJhd0NpcmNsZSgwLDAsdGhpcy5yYWRpdXMpO1xuICAgfVxuXG4gICAvL0Z1bmN0aW9uOiBkcmF3IGEgZG90dGVkIGNpcmNsZVxuICAgdGhpcy5kcmF3RG90dGVkID0gZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5jbGVhcigpO1xuXG4gICAgICAvLzIwIHBpeGVsIGxpbmVzIHdpdGggNSBwaXhlbCBnYXBzXG4gICAgICAvL3RoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5zZXRTdHJva2VEYXNoKFsyMCw1XSk7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3Muc2V0U3Ryb2tlU3R5bGUoMikuYmVnaW5TdHJva2UodGhpcy5jb2xvcikuZHJhd0NpcmNsZSgwLDAsdGhpcy5yYWRpdXMpO1xuICAgfVxuICAgIFxuICAgdGhpcy5kcmF3KCk7XG59XG5cbmZ1bmN0aW9uIFJlY3RhbmdsZShwb3MsIGNvbG9yLCB3aWR0aCwgaGVpZ2h0KXtcbiAgIEVhc2VsT2JqZWN0LmNhbGwodGhpcywgcG9zLCBjb2xvcik7XG5cbiAgIHRoaXMud2lkdGggID0gd2lkdGg7XG4gICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuXG4gICAvL0Vhc2VsLmpzIGRyYXdzIHJlY3RhbmdsZXMgdXNpbmcgY29vcmRpbmF0ZXMgcmVwcmVzZW50aW5nIHRoZSByZWN0YW5nbGUncyB1cHBlciBsZWZ0IGNvcm5lclxuICAgLy9UaGUgcG9zaXRpb24gb2Zmc2V0cyBoZXJlIGRyYXcgdGhlIHJlY3RhbmdsZSBzdWNoIHRoYXQgcG9zIHJlcHJlc2VudHMgdGhlIGNlbnRlciBpZiBpdC4gXG4gICB0aGlzLmVhc2VsU2hhcGUueCAtPSAgdGhpcy53aWR0aC8yXG4gICB0aGlzLmVhc2VsU2hhcGUueSAtPSAgdGhpcy5oZWlnaHQvMlxuICAgXG4gICAvL0RyYXcgdGhlIHJlY3RhbmdsZVxuICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5jbGVhcigpO1xuICAgICAgdGhpcy5nZXRFYXNlbFNoYXBlKCkuZ3JhcGhpY3MuYmVnaW5GaWxsKHRoaXMuY29sb3IpLmRyYXdSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgIH1cbiAgIHRoaXMuZHJhdygpO1xuXG59XG5cbmZ1bmN0aW9uIFJlc291cmNlKHZhbHVlKXtcbiAgIENpcmNsZS5jYWxsKHRoaXMsIHt4OiAwLCB5OiAwfSwgXCJ3aGl0ZVwiLCAxMCk7XG4gICB0aGlzLnZhbHVlID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIERpc2Vhc2Vab25lKHBsYXllclBvcyl7XG4gICBDaXJjbGUuY2FsbCh0aGlzLCBwbGF5ZXJQb3MsIFwicmVkXCIsIDc1KTtcbiAgIHRoaXMuZHJhd0RvdHRlZCgpO1xuICAgdGhpcy5BbGxvd3NUZWFtcyA9IGZhbHNlO1xuXG4gICAvL0ludmVydHMgd2hldGhlciB0aGUgZGlzZWFzZVpvbmUgYWxsb3dzIHRlYW1zXG4gICAvL1RPRE8gbWFrZSBwcm9wZXJ0eSBvZiBwbGF5ZXJcbiAgIHRoaXMuaW52ZXJ0QWxsb3dzVGVhbXMgPSBmdW5jdGlvbigpe1xuXG4gICAgIC8vU2V0IHRvIG5vdCBhbGxvdyB0ZWFtc1xuICAgICBpZih0aGlzLkFsbG93c1RlYW1zID09PSB0cnVlKXtcbiAgICAgICAgdGhpcy5jb2xvciA9IFwicmVkXCI7XG4gICAgICAgIHRoaXMuZHJhd0RvdHRlZCgpO1xuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICB0aGlzLmNvbG9yID0gXCJncmVlblwiO1xuICAgICAgICB0aGlzLmRyYXdEb3R0ZWQoKTtcbiAgICAgfVxuICAgICB0aGlzLkFsbG93c1RlYW1zID0gIXRoaXMuQWxsb3dzVGVhbXM7XG4gICB9O1xuICAgXG59XG5cbmZ1bmN0aW9uIENhbWVyYShwb3MsIHdpZHRoLCBoZWlnaHQpe1xuICAgdGhpcy5wb3MgPSBwb3M7XG4gICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgIHRoaXMuZ2V0UG9zID0gZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5wb3M7fTtcbiAgIHRoaXMuc2V0UG9zID0gZnVuY3Rpb24ocG9zKSB7dGhpcy5wb3MgPSBwb3M7fTtcbiAgIHRoaXMuZ2V0V2lkdGggPSBmdW5jdGlvbigpe3JldHVybiB0aGlzLndpZHRoO307XG4gICB0aGlzLnNldFdpZHRoID0gZnVuY3Rpb24od2lkdGgpIHt0aGlzLndpZHRoID0gd2lkdGg7fTtcbiAgIHRoaXMuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5oZWlnaHQ7fTtcbiAgIHRoaXMuc2V0SGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7dGhpcy5oZWlnaHQgPSBoZWlnaHQ7fTtcbn1cblxuZnVuY3Rpb24gUGxheWVyKHBvcyl7XG4gICBDaXJjbGUuY2FsbCggdGhpcywgcG9zLCBcInJlZFwiLCAyMCk7XG4gICAgLy97eDogY2FudmFzLndpZHRoLzIsIHk6IGNhbnZhcy5oZWlnaHQvMn0sIFwicmVkXCIsIDIwKTtcbiAgIFxuXG4gICB0aGlzLmlkO1xuICAgdGhpcy5kaXNlYXNlWm9uZSA9IG5ldyBEaXNlYXNlWm9uZSh0aGlzLmdldFBvcygpKTtcbiAgIHRoaXMucmVzb3VyY2VzID0gMDtcbiAgIHRoaXMuY2FtZXJhID0ge307XG4gICB0aGlzLnBhdGggPSBbXTtcblxuICAgLy90aGlzLmdldENhbWVyYSA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmNhbWVyYTt9O1xuICAgLy90aGlzLnNldENhbWVyYSA9IGZ1bmN0aW9uKGNhbWVyYSl7IHRoaXMuY2FtZXJhID0gY2FtZXJhOyB9O1xuICAgXG4gICAvL01vdmVzIHRoZSBwbGF5ZXIgYWxvbmcgYSBwYXRoIGRldGVybWluZWQgYnkgQSogYWxnb3JpdGhtXG4gICB0aGlzLmdvUGF0aCA9IGZ1bmN0aW9uKGRlbHRhVGltZSl7XG4gICAgICBcbiAgICAgIGlmKHRoaXMucGF0aC5lcXVhbHMoW10pID09PSBmYWxzZSlcbiAgICAgIHtcbiAgICAgICAgIHZhciBwb3MgPSB7eDogdGhpcy5wYXRoWzBdLngsIHk6IHRoaXMucGF0aFswXS55fTtcbiAgICAgICAgIHRoaXMuc2V0UG9zKHBvcyk7XG4gICAgICAgICB0aGlzLnBhdGguc3BsaWNlKDAsIDEqZGVsdGFUaW1lKTsgLy9SZW1vdmUgZGVsdGFUaW1lIGVsZW1lbnRzIHN0YXJ0aW5nIGZyb20gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZWxlbWVudCAwO1xuICAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgIH1cbiAgICAgdmFyIHBvcyA9IHt4OiB0aGlzLmdldFBvcygpLngsIHk6IHRoaXMuZ2V0UG9zKCkueX07IFxuICAgICAgcmV0dXJuIHBvcztcbiAgIH1cblxuICAgdGhpcy5nZXRSZXNvdXJjZXMgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5yZXNvdXJjZXM7fTtcbiAgIHRoaXMuc2V0UmVzb3VyY2VzID0gZnVuY3Rpb24obmV3UmVzb3VyY2VzKXsgdGhpcy5yZXNvdXJjZXMgPSBuZXdSZXNvdXJjZXN9O1xuXG4gICAvL092ZXJyaWRlIGluaGVyaXRlZCBzZXRQb3NcbiAgIHZhciBwYXJlbnRTZXRQb3MgPSB0aGlzLnNldFBvcztcbiAgIHRoaXMuc2V0UG9zID0gZnVuY3Rpb24ocG9zKXsgXG4gICAgICAgLy90aGlzLmNhbWVyYS5zZXRQb3MocG9zKTtcbiAgICAgICB0aGlzLmRpc2Vhc2Vab25lLnNldFBvcyhwb3MpO1xuICAgICAgIHBhcmVudFNldFBvcy5jYWxsKHRoaXMsIHBvcyk7IC8vbmVlZCBjYWxsIHNvICd0aGlzJyBpcyBkZWZpbmVkIGFzIHRoZSBjdXJyZW50IFBsYXllclxuICAgfTtcbiAgIHRoaXMuc2V0UG9zKHBvcyk7XG5cbiAgIC8vT3ZlcnJpZGUgaW5oZXJpdGVkIGFkZFxuICAgdmFyIHBhcmVudEFkZCA9IHRoaXMuYWRkO1xuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihzdGFnZSl7XG4gICAgICB0aGlzLmRpc2Vhc2Vab25lLmFkZChzdGFnZSk7XG4gICAgICBwYXJlbnRBZGQuY2FsbCh0aGlzLCBzdGFnZSk7XG4gICB9XG5cbiAgIHZhciBwYXJlbnRSZW1vdmUgPSB0aGlzLnJlbW92ZTtcbiAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oc3RhZ2Upe1xuICAgICAgdGhpcy5kaXNlYXNlWm9uZS5yZW1vdmUoc3RhZ2UpO1xuICAgICAgcGFyZW50UmVtb3ZlLmNhbGwodGhpcywgc3RhZ2UpO1xuICAgfVxuICAgICAgXG4gICAvL0NoZWNrIGlmIHN0YW5kaW5nIG9uIGFueSByZXNvdXJjZXNcbiAgIHRoaXMucGlja3VwID0gZnVuY3Rpb24oc3RhZ2UsIHJlc291cmNlcyl7XG4gICAgICB2YXIgZWFzZWxTaGFwZSA9IHRoaXMuZ2V0RWFzZWxTaGFwZSgpO1xuICAgICAgdmFyIHJlc291cmNlQ29weSA9IHJlc291cmNlcy5zbGljZSgwLHJlc291cmNlcy5sZW5ndGgpO1xuICAgICAgLy9mb3IgKHZhciB4IG9mIHJlc291cmNlQ29weSl7XG4gICAgICBmb3IoIGkgPSAwOyBpIDwgcmVzb3VyY2VDb3B5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgIHZhciB4ID0gcmVzb3VyY2VDb3B5W2ldOyAvL2N1cnJlbnQgcmVzb3VyY2VcblxuICAgICAgICAgdmFyIHBvcyA9IHguZ2V0UG9zKCk7XG4gICAgICAgICB2YXIgcHQgPSAgZWFzZWxTaGFwZS5nbG9iYWxUb0xvY2FsKHBvcy54LCBwb3MueSk7IC8vaGl0VGVzdCBuZWVkcyBjb29yZGluYXRlcyByZWxhdGl2ZSB0byBlYXNlbFNoYXBlXG4gICAgICAgICBpZihlYXNlbFNoYXBlLmhpdFRlc3QocHQueCwgcHQueSkpIC8vSWYgcGxheWVyIGlzIG92ZXIgcmVzb3VyY2VcbiAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2V0UmVzb3VyY2VzKHRoaXMuZ2V0UmVzb3VyY2VzKCkgKyB4LnZhbHVlKTtcbiAgICAgICAgICAgIHZhciByZW1JbmRleCA9IHJlc291cmNlcy5pbmRleE9mKHgpO1xuICAgICAgICAgICAgcmVzb3VyY2VzLnNwbGljZShyZW1JbmRleCwxKTtcbiAgICAgICAgICAgIHgucmVtb3ZlKHN0YWdlKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cbn1cblxuLy9Db250cm9scyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy9DcmVhdGVzIGEgSm95c3RpY2sgYXQgdGhlIGdpdmVuIGxvY2F0aW9uXG5mdW5jdGlvbiBKb3lzdGljayhwb3MsIHBsYXllcil7XG5cbiAgIHRoaXMucG9zID0gcG9zO1xuICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cbiAgIHRoaXMuYmFzZVNpemUgPSAzNTtcbiAgIHRoaXMuYmFzZUNvbG9yID0gXCJncmV5XCI7XG4gICB0aGlzLmJhc2UgPSBuZXcgQ2lyY2xlKHRoaXMucG9zLCB0aGlzLmJhc2VDb2xvciwgdGhpcy5iYXNlU2l6ZSk7XG5cbiAgIHRoaXMuc3RpY2tTaXplID0gMjU7XG4gICB0aGlzLnN0aWNrQ29sb3IgPSBcIndoaXRlXCI7XG4gICB0aGlzLnN0aWNrID0gIG5ldyBDaXJjbGUodGhpcy5wb3MsIHRoaXMuc3RpY2tDb2xvciwgdGhpcy5zdGlja1NpemUpO1xuXG4gICAvL1ByZXZlbnQgc2Nyb2xsaW5nXG4gICB0aGlzLnN0aWNrLmdldEVhc2VsU2hhcGUoKS5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyBcbiAgIH0pO1xuXG4gICAvL0xpbWl0ZWQgRHJhZ2dpbmdcbiAgIHRoaXMuc3RpY2suZ2V0RWFzZWxTaGFwZSgpLm9uKFwicHJlc3Ntb3ZlXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgZS50YXJnZXQueCA9IGUuc3RhZ2VYOyAvLyhzdGFnZVgsIHN0YWdlWSkgPSBtb3VzZUNvb3JkaW5hdGVcbiAgICAgIGUudGFyZ2V0LnkgPSBlLnN0YWdlWTtcbiAgIH0pO1xuICAgXG4gICB2YXIgYmFzZVZhciA9IHRoaXMuYmFzZTsgLy9ObyBpZGVhIHdoeSBJIGhhdmUgdG8gZG8gdGhpczsgc2NvcGluZz9cbiAgIC8vUmVzZXQgc3RpY2sgdG8gYmFzZSBwb3RpdGlvbiBvbiB3aGVuIGpveXN0aWNrIGlzIHJlbGVhc2VkXG4gICB0aGlzLnN0aWNrLmdldEVhc2VsU2hhcGUoKS5vbihcInByZXNzdXBcIiwgZnVuY3Rpb24oZSl7XG4gICAgICBlLnRhcmdldC54ID0gYmFzZVZhci5nZXRQb3MoKS54OyAgXG4gICAgICBlLnRhcmdldC55ID0gYmFzZVZhci5nZXRQb3MoKS55O1xuICAgfSk7XG4gICBcbiAgIHRoaXMuZ2V0UG9zID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmJhc2UuZ2V0UG9zKCl9O1xuICAgdGhpcy5zZXRQb3MgPSBmdW5jdGlvbihwb3MpIHtcbiAgICAgIHRoaXMuYmFzZS5zZXRQb3MocG9zKTtcbiAgICAgIHRoaXMuc3RpY2suc2V0UG9zKHBvcyk7XG4gICB9XG5cbiAgIC8vR2V0IHRoZSBkaXJlY3Rpb24gdGhlIGpveXN0aWNrIGlzIHBvaW50aW5nXG4gICB0aGlzLmdldERpcmVjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgdiA9IHRoaXMuc3RpY2suZ2V0UG9zKCk7XG4gICAgICB2YXIgdyA9IHRoaXMuYmFzZS5nZXRQb3MoKTtcbiAgICAgIHZhciB4MSA9IHYueCAtIHcueDsgLy9uZXcgY29vcmRpbmF0ZXNcbiAgICAgIHZhciB5MSA9IHYueSAtIHcueTtcbiAgICAgIHZhciBtYWcxID0gTWF0aC5zcXJ0KHgxKngxICsgeTEqeTEpO1xuXG4gICAgICByZXR1cm4ge3g6IHgxL21hZzEsIHk6IHkxL21hZzF9XG4gICB9O1xuXG4gICAvL0dldCB0aGUgZm9yY2UgYWN0aW5nIG9uIGEgcGxheWVyIGJ5IHRoZSBqb3lzdGlja1xuICAgdGhpcy5nZXRGb3JjZSA9IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgdiA9IHRoaXMuc3RpY2suZ2V0UG9zKCk7XG4gICAgICB2YXIgdyA9IHRoaXMuYmFzZS5nZXRQb3MoKTtcbiAgICAgIHJldHVybiBNYXRoLmFicyhNYXRoLnNxcnQodi54KnYueCArIHYueSp2LnkpIC0gTWF0aC5zcXJ0KHcueCp3LnggKyB3Lnkqdy55KSk7XG4gICB9O1xuXG5cbiAgIC8vVXBkYXRlIHBsYXllcidzIGxvY2F0aW9uIHdpdGggcmVzcGVjdCB0byBqb3lzdGlja1xuICAgdGhpcy5tb3ZlID0gZnVuY3Rpb24gKGRlbHRhKSB7IC8vRGVsdGEgaXMgZGVsdGFUaW1lXG5cbiAgICAgIC8vTW92ZSBwbGF5ZXIgd2l0aCBsZWZ0IGpveXN0aWNrXG4gICAgICB2YXIgcGxheWVyUG9zID0gdGhpcy5wbGF5ZXIuZ2V0UG9zKCk7XG4gICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcblxuICAgICAgLy9UT0RPIG1ha2UgZGFtcGluZyBwbGF5ZXIgcHJvcGVydHlcbiAgICAgIHZhciBkYW1waW5nID0gMS8yMDtcbiAgICAgIGlmKGlzTmFOKGRpcmVjdGlvbi54KSB8fCBpc05hTihkaXJlY3Rpb24ueSkpXG4gICAgICB7XG4gICAgICAgICBkaXJlY3Rpb24ueCA9IDA7XG4gICAgICAgICBkaXJlY3Rpb24ueSA9IDA7XG4gICAgICB9XG4gICAgICBwbGF5ZXJQb3MueCArPSBkYW1waW5nKmRlbHRhKnRoaXMuZ2V0Rm9yY2UoKSpkaXJlY3Rpb24ueDtcbiAgICAgIHBsYXllclBvcy55ICs9IGRhbXBpbmcqZGVsdGEqdGhpcy5nZXRGb3JjZSgpKmRpcmVjdGlvbi55O1xuICAgICAgdGhpcy5wbGF5ZXIuc2V0UG9zKHBsYXllclBvcyk7XG5cbiAgIH07XG5cblxuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihzdGFnZSl7XG4gICAgICBzdGFnZS5hZGRDaGlsZCh0aGlzLmJhc2UuZ2V0RWFzZWxTaGFwZSgpKTtcbiAgICAgIHN0YWdlLmFkZENoaWxkKHRoaXMuc3RpY2suZ2V0RWFzZWxTaGFwZSgpKTtcbiAgICAgIHN0YWdlLnVwZGF0ZSgpO1xuICAgfVxuXG59XG5cbi8vQnV0dG9uIGZvciBvcHRpbmcgaW4gb3Igb3V0IG9mIHRlYW1zXG5mdW5jdGlvbiBUZWFtQnV0dG9uKHBvcywgY29sb3IsIHBsYXllcil7XG5cbiAgIC8vVE9ETyBtYWtlIGJhc2VTaXplIHNvbWUga2luZCBvZiBnbG9iYWwgdmFyaWFibGVcbiAgIHZhciBiYXNlU2l6ZSA9IDM1O1xuICAgQ2lyY2xlLmNhbGwodGhpcywgcG9zLCBjb2xvciwgYmFzZVNpemUpO1xuXG4gICB0aGlzLnBsYXllciA9IHBsYXllcjtcblxuICAgdGhpcy5nZXRFYXNlbFNoYXBlKCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKXtcbiAgICAgIHBsYXllci5kaXNlYXNlWm9uZS5pbnZlcnRBbGxvd3NUZWFtcygpO1xuICAgfSk7XG59XG4vL0NvbnRyb2xzIF5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuXG4vL0RyYWdhYmxlIENsYXNzOiBNYWtlcyBvYmplY3RzIERyYWdhYmxlXG5mdW5jdGlvbiBEcmFnYWJsZShwb3MsIGNvbG9yKXtcblxuICAgLy9DYWxsIHN1cGVyY2xhc3MncyBjb25zdHJ1Y3RvclxuICAgRWFzZWxPYmplY3QuY2FsbCh0aGlzLCBwb3MsIGNvbG9yKTtcblxuICAgLy9VcGRhdGUgY29vcmRpbmF0ZXMgd2hpbGUgb2JqZWN0IGlzIG1vdmVkIHdoaWxlIHByZXNzZWRcbiAgIHRoaXMuZ2V0RWFzZWxTaGFwZSgpLm9uKFwicHJlc3Ntb3ZlXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgZS50YXJnZXQueCA9IGUuc3RhZ2VYOyAvLyhzdGFnZVgsIHN0YWdlWSkgPSBtb3VzZUNvb3JkaW5hdGVcbiAgICAgIGUudGFyZ2V0LnkgPSBlLnN0YWdlWTtcbiAgIH0pO1xuXG59O1xuXG5cblxuXG4vL0NsYXNzIGRlZmluaXRpb25zOl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuZXhwb3J0cy5FYXNlbE9iamVjdCA9IEVhc2VsT2JqZWN0O1xuZXhwb3J0cy5DaXJjbGUgICAgICA9IENpcmNsZTtcbmV4cG9ydHMuUmVjdGFuZ2xlICAgPSBSZWN0YW5nbGU7XG5leHBvcnRzLlJlc291cmNlICAgID0gUmVzb3VyY2U7XG5leHBvcnRzLkNhbWVyYSAgICAgID0gQ2FtZXJhO1xuZXhwb3J0cy5EaXNlYXNlWm9uZSA9IERpc2Vhc2Vab25lO1xuZXhwb3J0cy5QbGF5ZXIgICAgICA9IFBsYXllcjtcbmV4cG9ydHMuSm95c3RpY2sgICAgPSBKb3lzdGljaztcbmV4cG9ydHMuVGVhbUJ1dHRvbiAgPSBUZWFtQnV0dG9uO1xuIiwiLyogSU1QT1JUQU5UOiBTZXZlcmFsIHZhcmlhYmxlcyBpbiB0aGlzIGpzLCBsaWtlIFwiaW9cIiwgZXhpc3QgYmVjYXVzZVxuICAgbWFpbkdhbWUuanMgaXMgaW5jbHVkZWQgYmVsb3cgc29ja2V0LmlvLmpzIGluIHZpZXdzL2NpdGl6ZW4uaGFuZGxlYmFycy5cbiAgICAqL1xuXG5cbi8qIEltcG9ydCBjbGFzc2VzICovXG5cbi8vUmVxdWlyaW5nIGVuYWJsZWQgYnkgYnJvd3NlcmlmeVxuXG52YXIgRWFzZWxPYmplY3QgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkVhc2VsT2JqZWN0O1xudmFyIENpcmNsZSAgICAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5DaXJjbGU7XG52YXIgUmVjdGFuZ2xlICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlJlY3RhbmdsZTtcbnZhciBSZXNvdXJjZSAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuUmVzb3VyY2U7XG52YXIgQ2FtZXJhICAgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkNhbWVyYTtcbnZhciBEaXNlYXNlWm9uZSA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuRGlzZWFzZVpvbmU7XG52YXIgUGxheWVyICAgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlBsYXllcjtcbnZhciBKb3lzdGljayAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuSm95c3RpY2s7XG52YXIgVGVhbUJ1dHRvbiAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlRlYW1CdXR0b247XG5cblxudmFyIGdhbWVwb3J0ID0gODA4MDsgLy9wb3J0IGNsaWVudHMgd2lsbCBjb25uZWN0IHRvIFxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpbkNhbnZhc1wiKTtcbnZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbmNhbnZhcy53aWR0aCAgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7IFxuXG52YXIgc3RhZ2UgICAgICAgID0gbmV3IGNyZWF0ZWpzLlN0YWdlKFwibWFpbkNhbnZhc1wiKTtcblxudmFyIHBsYXllcixcbiAgICByZW1vdGVQbGF5ZXJzLFxuICAgIGRlbHRhVGltZSxcbiAgICBzb2NrZXQ7XG5cbm1haW4oKTtcblxuXG5mdW5jdGlvbiBtYWluKCl7XG4gICBcbiAgIC8vSW5pdGlhbGl6ZSB0aGUgZ2FtZSB3b3JsZFxuICAgdmFyIHdvcmxkICAgICAgICA9IGluaXRXb3JsZCgpO1xuICAgdmFyIGJhY2tncm91bmQgICA9IGluaXRCYWNrZ3JvdW5kKHN0YWdlLCBjYW52YXMpO1xuXG4gICBcbiAgIC8vSW5pdGFsaXplIHRoZSBnYW1lIGNvbnRyb2xzIGFuZCBwbGF5ZXJcbiAgIHBsYXllciAgICAgICAgICAgPSBpbml0UGxheWVyKHN0YWdlKTtcbiAgIC8vcGxheWVyLnNldENhbWVyYShuZXcgQ2FtZXJhKHBsYXllci5nZXRQb3MoKSwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XG4gICB2YXIgbGVmdEpveXN0aWNrID0gaW5pdEpveXN0aWNrcyhzdGFnZSwgcGxheWVyKS5sZWZ0O1xuICAgdmFyIHRlYW1CdXR0b24gICA9IGluaXRUZWFtQnV0dG9uKHN0YWdlLCBwbGF5ZXIpO1xuXG4gICAvL0luaXRpYWxpemUgYXJyYXkgb2YgcmVzb3VyY2Ugb2JqZWN0cyBhbmQgcmVzb3VyY2UgdGV4dFxuICAgdmFyIHJlc291cmNlcyAgICA9IGluaXRSZXNvdXJjZXMoc3RhZ2UsIGNhbnZhcyk7XG4gICB2YXIgcmVzb3VyY2VUZXh0ID0gaW5pdFJlc291cmNlVGV4dChzdGFnZSxjYW52YXMsIHBsYXllcik7XG5cbiAgIC8vSW5pdGlhbGl6ZSBQYXRoZmluZGluZ1xuICAgdmFyIGVhc3lzdGFyID0gaW5pdFBhdGhmaW5kaW5nKHdvcmxkLCBwbGF5ZXIsIGJhY2tncm91bmQpOyBcbiAgIFxuICAgLy9FbmFibGUgdG91Y2ggYmFzZWQgaW50ZXJmYWNlIGZvciBtb2JpbGUgZGV2aWNlc1xuICAgY3JlYXRlanMuVG91Y2guZW5hYmxlKHN0YWdlKTtcblxuICAgLy9SZXNpemUgY2FudmFzIG9uIHdpbmRvdyByZXNpemUgICBcbiAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uKCl7XG4gICAgICBzdGFnZS5jYW52YXMud2lkdGggID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICBzdGFnZS5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgYmFja2dyb3VuZC53aWR0aCAgICA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgYmFja2dyb3VuZC5oZWlnaHQgICA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgIGJhY2tncm91bmQuZHJhdygpO1xuXG4gICAgICAvL1RPRE8gZW5jYXBzdWxhdGUgdGhlc2Ugb2Zmc2V0cyB3aXRoaW4gSm95c3RpY2sgYW5kIFRlYW1CdXR0b25cbiAgICAgIGxlZnRKb3lzdGljay5zZXRQb3Moe3g6IHdpbmRvdy5pbm5lcldpZHRoLzYsIHk6IHdpbmRvdy5pbm5lckhlaWdodC8yfSk7XG4gICAgICB0ZWFtQnV0dG9uLnNldFBvcyh7eDogd2luZG93LmlubmVyV2lkdGggLSB3aW5kb3cuaW5uZXJXaWR0aC82LCB5OiB3aW5kb3cuaW5uZXJIZWlnaHQvMn0pO1xuXG5cbiAgIH0sIGZhbHNlKTtcbiAgIFxuXG4gICAvKiBNdWx0aXBsYXllciBpbml0aWFsaXphdGlvbiBjb2RlICovXG4gICAvL0Nvbm5lY3QgY2xpZW50IHRvIHNlcnZlciBcbiAgIHNvY2tldCA9IGlvLmNvbm5lY3QoKTtcbiAgIFxuICAgLy9Jbml0aWFsaXplIHJlbW90ZSBwbGF5ZXJzIFxuICAgcmVtb3RlUGxheWVycyA9IFtdO1xuXG4gICAvL0xpc3RlbiBmb3IgZXZlbnRzXG4gICBzZXRFdmVudEhhbmRsZXJzKCk7XG5cblxuICAgLy9NYWluIGdhbWUgbG9vcC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIHZhciBGUFMgPSA1MDtcbiAgIGNyZWF0ZWpzLlRpY2tlci5zZXRGUFMoRlBTKTtcbiAgIHZhciBwcmV2aW91c1RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgdmFyIGN1cnJlbnRUaW1lO1xuICAgLy8gcGl4ZWxzL2ZyYW1lICogZnJhbWVzL3NlY29uZCA9IHBpeGVscy9zZWNvbmQ6IGRlbHRhIHRpbWUgaXNcbiAgIC8vIGVtcGlyaWNhbCBGUFNcbiAgIGNyZWF0ZWpzLlRpY2tlci5hZGRFdmVudExpc3RlbmVyKFwidGlja1wiLCBmdW5jdGlvbigpe1xuXG4gICAgICAvL0xvZ2ljIHRvIGNyZWF0ZSBkZWx0YVRpbWUgc28gbW92ZW1lbnQgaXMgcmVsYXRpdmUgdG8gdGltZVxuICAgICAgLy9yYXRoZXIgdGhhbiBmcmFtZXMuXG4gICAgICB2YXIgdGltZXIgPSBuZXcgRGF0ZSgpO1xuICAgICAgY3VycmVudFRpbWUgPSB0aW1lci5nZXRUaW1lKCk7XG4gICAgICBkZWx0YVRpbWUgPSBjdXJyZW50VGltZSAtIHByZXZpb3VzVGltZTtcbiAgICAgIHByZXZpb3VzVGltZSA9IGN1cnJlbnRUaW1lO1xuXG4gICAgICAvL0RvIHBhdGhmaW5kaW5nIGNhbGN1bGF0aW9uXG4gICAgICBlYXN5c3Rhci5jYWxjdWxhdGUoKTtcblxuICAgICAgLy9Nb3ZlIHBsYXllciBhY2NvcmRpbmcgdG8gam95c3RpY2tcbiAgICAgIGxlZnRKb3lzdGljay5tb3ZlKGRlbHRhVGltZSk7XG5cbiAgICAgIC8vQ2hlY2sgaWYgcGxheWVyIGlzIGNvbGxpZGluZyB3aXRoIHJlc291cmNlc1xuICAgICAgcGxheWVyLnBpY2t1cChzdGFnZSwgcmVzb3VyY2VzKTtcblxuICAgICAgLy9Nb3ZlIGFsb25nIGNhbGN1bGF0ZWQgcGF0aGZpbmRpbmcgcGF0aFxuICAgICAgcGF0aFBsYXllcnMocGxheWVyLGRlbHRhVGltZSk7XG5cbiAgICAgIC8vVXBkYXRlIHJlc291cmNlIHRleHRcbiAgICAgIHJlc291cmNlVGV4dC50ZXh0ID0gXCJSZXNvdXJjZXM6IFwiK3BsYXllci5nZXRSZXNvdXJjZXMoKTtcblxuICAgICAgLy9Db21taXQgYWxsIHVwZGF0ZXMgdG8gYWN0dWFsIHN0YWdlL2NhbnZhc1xuICAgICAgc3RhZ2UudXBkYXRlKCk7XG5cbiAgIH0pO1xuXG59XG4vL1V0aWxpdHkgZnVuY3Rpb25zOi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vL1V0aWxpdHkgZnVuY3Rpb24gZm9yIGNvbXBhcmluZyBhcnJheXMgZm9yIGVxdWFsaXR5XG5BcnJheS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24oIGFycmF5ICkge1xuICByZXR1cm4gdGhpcy5sZW5ndGggPT0gYXJyYXkubGVuZ3RoICYmIFxuICAgICAgICAgICB0aGlzLmV2ZXJ5KCBmdW5jdGlvbih0aGlzX2ksaSkgeyByZXR1cm4gdGhpc19pID09IGFycmF5W2ldIH0gKSAgXG59XG5cblxuLy9VdGlsaXR5IGZ1bmN0aW9uczpeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cblxuZnVuY3Rpb24gcGF0aFBsYXllcnMocGxheWVyLGRlbHRhVGltZSl7XG4gICAgIFxuICAgICAgdmFyIG5ld1BhdGhQb3M7XG4gICAgICBwbGF5ZXIuZ29QYXRoKGRlbHRhVGltZSk7XG4gICAgICBzb2NrZXQuZW1pdChcIm1vdmUgcGxheWVyXCIsIHsgIHg6IHBsYXllci5nZXRQb3MoKS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcGxheWVyLmdldFBvcygpLnkgfSk7XG4gICAgICBmb3IoaSA9IDA7IGkgPCByZW1vdGVQbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICBjdXJyUGxheWVyID0gcmVtb3RlUGxheWVyc1tpXTtcbiAgICAgICAgIG5ld1BhdGhQb3MgPSBjdXJyUGxheWVyLmdvUGF0aChkZWx0YVRpbWUpO1xuXG4gICAgICAgICAvL0VhY2ggcGxheWVyIGFscmVhZHkgdXBkYXRlcyB0aGVpciBvd24gcG9zaXRpb24gb24gdGhlIHNlcnZlcixcbiAgICAgICAgIC8vdGhpcyBjYWxsIGlzIHVuZWNlc3NhcnlcbiAgICAgICAgIC8qc29ja2V0LmVtaXQoXCJtb3ZlIHBsYXllclwiLCB7ICB4OiBuZXdQYXRoUG9zLnhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IG5ld1BhdGhQb3MueSB9KTsqL1xuICAgICAgfVxufVxuXG4vL0NyZWF0ZXMgYSBzcXVhcmUgd29ybGQgb2Ygc2l6ZSAxMDAwIHRoYXQgb3VyIHBhdGhmaW5kaW5nIGFsZ29yaXRobSBjYW4gdXNlXG5mdW5jdGlvbiBpbml0V29ybGQoKXtcbiAvL1RPRE8gbWFrZSBzaXplIG9mIGNhbnZhcywgcmVzaXplIHdpdGggY2FudmFzXG4gICB2YXIgc2l6ZSA9IDEwMDA7XG4gICB2YXIgd29ybGQgPSBbXVxuICAgZm9yKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKyl7XG4gICAgICB3b3JsZFtpXSA9IFtdXG4gICAgICBmb3IodmFyIGogPSAwOyBqIDwgc2l6ZTsgaisrKXtcbiAgICAgICAgIHdvcmxkW2ldW2pdID0wO1xuICAgICAgfVxuICAgfVxuICAgcmV0dXJuIHdvcmxkO1xufVxuXG4vL0NyZWF0ZXMgYW5kIGRpc3BsYXllcyB0aGUgUmVzb3VyY2VzOiB4IHRleHRcbmZ1bmN0aW9uIGluaXRSZXNvdXJjZVRleHQoc3RhZ2UsIGNhbnZhcywgcGxheWVyKXtcbiAgIHJlc291cmNlVGV4dCA9IG5ldyBjcmVhdGVqcy5UZXh0KFwiUmVzb3VyY2VzOiBcIitwbGF5ZXIuZ2V0UmVzb3VyY2VzKCksIFwiMjBweCBBcmlhbFwiLCBcIndoaXRlXCIpO1xuICAgcmVzb3VyY2VUZXh0LnggPSAwO1xuICAgcmVzb3VyY2VUZXh0LnkgPSBjYW52YXMuaGVpZ2h0LzEyOyAvL1RPRE8gbW9yZSBsb2dpY2FsbHkgcG9zaXRpb24gUmVzb3VyY2VzIHRleHRcbiAgIHJlc291cmNlVGV4dC50ZXh0QmFzZWxpbmUgPSBcImFscGhhYmV0XCI7IC8vTm90IHN1cmUgd2hhdCB0aGlzIHNldHRpbmcgZG9lc1xuICAgc3RhZ2UuYWRkQ2hpbGQocmVzb3VyY2VUZXh0KTtcbiAgIHJldHVybiByZXNvdXJjZVRleHQ7XG5cbn1cblxuLy9DcmVhdGVzIGFuIGFycmF5IG9mIHJhbmRvbWx5IHBsYWNlZCBSZXNvdXJjZXMgb24gdGhlIHN0YWdlXG5mdW5jdGlvbiBpbml0UmVzb3VyY2VzKHN0YWdlLCBjYW52YXMpe1xuXG4gICB2YXIgbnVtUmVzb3VyY2VzID0gMzsgLy9UT0RPIG1ha2UgZ2xvYmFsL21ha2UgbG9naWNhbCBjaG9pY2UuIFRvbyBoaWdoIGEgbnVtYmVyIG1heSBpbmN1ciByZXNvdXJjZSBwcm9ibGVtc1xuICAgdmFyIGN1cnJQb3MgPSB7eDogMCwgeTogMH07XG4gICB2YXIgcmVzb3VyY2VzID0gW107XG4gICB2YXIgcmVzb3VyY2VWYWx1ZSA9IDEwO1xuXG4gICBmb3IgKGkgPSAwOyBpIDwgbnVtUmVzb3VyY2VzOyBpICsrKXtcbiAgICAgIGN1cnJQb3MueCA9IE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiBjYW52YXMud2lkdGgpKTsgLy9SYW5kb20gbnVtYmVyIGZyb20gemVybyB0byBjYW52YXMud2lkdGhcbiAgICAgIGN1cnJQb3MueSA9IE1hdGguZmxvb3IoKE1hdGgucmFuZG9tKCkgKiBjYW52YXMuaGVpZ2h0KSk7XG5cbiAgICAgIHZhciByZXNvdXJjZSA9IG5ldyBSZXNvdXJjZShyZXNvdXJjZVZhbHVlKTtcbiAgICAgIHJlc291cmNlLnNldFBvcyhjdXJyUG9zKTtcbiAgICAgIHJlc291cmNlLmFkZChzdGFnZSk7XG4gICAgICByZXNvdXJjZXMucHVzaChyZXNvdXJjZSk7XG4gICB9XG5cbiAgIHJldHVybiByZXNvdXJjZXM7XG59XG5cbi8vQ3JlYXRlIGFuIG9iamVjdCB0byByZXByZXNlbnQgdGhlIGJhY2tncm91bmQgYW5kIHJlZ2lzdGVyIHBhdGhmaW5kaW5nIGV2ZW50c1xuZnVuY3Rpb24gaW5pdEJhY2tncm91bmQoc3RhZ2UsIGNhbnZhcyl7XG4gICB2YXIgY29sb3IgPSBcImJsYWNrXCI7XG4gICB2YXIgd2lkdGggPSBjYW52YXMud2lkdGg7XG4gICB2YXIgaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICAgXG4gICBcbiAgIHZhciBiYWNrZ3JvdW5kID0gbmV3IFJlY3RhbmdsZSgge3g6IHdpZHRoLzIsIHk6IGhlaWdodC8yfSwgY29sb3IsIHdpZHRoLCBoZWlnaHQpO1xuICAgYmFja2dyb3VuZC5hZGQoc3RhZ2UpO1xuXG4gICByZXR1cm4gYmFja2dyb3VuZDtcblxufVxuXG4vL0NyZWF0ZSBkZXNpcmVkIEpveXN0aWNrcyBmb3IgdGhlIHVzZXJcbmZ1bmN0aW9uIGluaXRKb3lzdGlja3Moc3RhZ2UsIHBsYXllcil7XG4gICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluQ2FudmFzXCIpO1xuICAgLy92YXIgcmlnaHQgID0gbmV3IEpveXN0aWNrKHt4OmNhbnZhcy53aWR0aCAtIGNhbnZhcy53aWR0aC82LCB5OiBjYW52YXMuaGVpZ2h0LzJ9KTtcbiAgIHZhciBsZWZ0ID0gbmV3IEpveXN0aWNrKHt4OiBjYW52YXMud2lkdGgvNiwgeTogY2FudmFzLmhlaWdodC8yfSwgcGxheWVyKTtcblxuICAgLy9BZGQgdG8gY2FudmFzXG4gICAvL3JpZ2h0LmFkZChzdGFnZSk7XG4gICBsZWZ0LmFkZChzdGFnZSk7XG5cbiAgIHJldHVybiB7bGVmdDogbGVmdH07XG59XG5cbi8vQ3JlYXRlcyBhIHBsYXllciBhbmQgYXNzb2NpYXRlcyBpdCB0byBhIGpveXN0aWNrXG5mdW5jdGlvbiBpbml0UGxheWVyKHN0YWdlKXtcblxuICAgLy9Jbml0IGxvY2FsIHBsYXllclxuICAgcGxheWVyID0gbmV3IFBsYXllcih7eDogc3RhZ2UuY2FudmFzLndpZHRoLzIsIHk6IHN0YWdlLmNhbnZhcy5oZWlnaHQvMn0pO1xuICAgcGxheWVyLmFkZChzdGFnZSk7XG5cblxuICAgcmV0dXJuIHBsYXllcjtcbn1cblxuLy9DcmVhdGVzIGEgYnV0dG9uIHRoYXQgYWxsb3dzIHVzZXJzIHRvIG9wdCBpbiBvciBvdXQgb2YgdGVhbXNcbmZ1bmN0aW9uIGluaXRUZWFtQnV0dG9uKHN0YWdlLCBwbGF5ZXIpe1xuXG4gICAvL1B1dCBidXR0b24gYXQgcmlnaHQgb2Ygam95c3RpY2tcbiAgIHZhciBidXR0b25Qb3MgPSB7eDogc3RhZ2UuY2FudmFzLndpZHRoIC0gc3RhZ2UuY2FudmFzLndpZHRoLzYsIHk6IHN0YWdlLmNhbnZhcy5oZWlnaHQvMn07XG4gICB2YXIgdGVhbUJ1dHRvbiA9IG5ldyBUZWFtQnV0dG9uKGJ1dHRvblBvcywgXCJncmV5XCIsIHBsYXllcik7XG4gICB0ZWFtQnV0dG9uLmFkZChzdGFnZSk7XG5cbiAgIHJldHVybiB0ZWFtQnV0dG9uO1xufVxuXG4vL0luaXRpYWxpemUgQSogcGF0aGZpbmRpbmcgd2l0aCBlYXN5c3RhciBsaWJhcnlcbmZ1bmN0aW9uIGluaXRQYXRoZmluZGluZyh3b3JsZCwgcGxheWVyLCBiYWNrZ3JvdW5kKXtcblxuICAgdmFyIGVhc3lzdGFyID0gbmV3IEVhc3lTdGFyLmpzKCk7XG4gICBlYXN5c3Rhci5zZXRHcmlkKHdvcmxkKTtcbiAgIGVhc3lzdGFyLnNldEFjY2VwdGFibGVUaWxlcyhbMF0pOyAvL3RpbGVzIHdlJ3JlIGFibGUgdG8gd2FsayBvblxuICAgZWFzeXN0YXIuZW5hYmxlRGlhZ29uYWxzKCk7IFxuICAgXG4gICAvL0dlbmVyYXRlIHBhdGggd2hlbiBiYWNrZ3JvdW5kIGlzIGNsaWNrZWRcbiAgIGJhY2tncm91bmQuZ2V0RWFzZWxTaGFwZSgpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgICB2YXIgcG9zID0gcGxheWVyLmdldFBvcygpO1xuICAgICAgICAgXG4gICAgICAgICBlYXN5c3Rhci5maW5kUGF0aChNYXRoLmZsb29yKHBvcy54KSwgTWF0aC5mbG9vcihwb3MueSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5mbG9vcihlLnN0YWdlWCksIE1hdGguZmxvb3IoZS5zdGFnZVkpLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHBhdGgpeyBcbiAgICAgICAgICAgICAgaWYoIHBhdGggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUGF0aCBub3QgZm91bmRcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgIHBsYXllci5wYXRoID0gcGF0aDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG4gICB9KTtcbiAgIHJldHVybiBlYXN5c3Rhcjtcbn1cblxuZnVuY3Rpb24gc2V0RXZlbnRIYW5kbGVycygpIHtcbiAgIHNvY2tldC5vbihcImNvbm5lY3RcIiwgb25Tb2NrZXRDb25uZWN0ZWQpO1xuICAgc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCBvblNvY2tldERpc2Nvbm5lY3QpO1xuICAgc29ja2V0Lm9uKFwibmV3IHBsYXllclwiLCBvbk5ld1BsYXllcik7XG4gICBzb2NrZXQub24oXCJtb3ZlIHBsYXllclwiLCBvbk1vdmVQbGF5ZXIpO1xuICAgc29ja2V0Lm9uKFwicmVtb3ZlIHBsYXllclwiLCBvblJlbW92ZVBsYXllcik7XG59O1xuXG5mdW5jdGlvbiBvblNvY2tldENvbm5lY3RlZCgpIHtcbiAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IENsaWVudCBjb25uZWN0ZWQgb24gcG9ydCA6IFwiK2dhbWVwb3J0KTsgXG4gICBzb2NrZXQuZW1pdChcIm5ldyBwbGF5ZXJcIiwgeyAgICB4OiBzdGFnZS5jYW52YXMud2lkdGgvMiwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogc3RhZ2UuY2FudmFzLmhlaWdodC8yIH0pO1xufVxuXG5mdW5jdGlvbiBvblNvY2tldERpc2Nvbm5lY3QoKSB7XG4gICBjb25zb2xlLmxvZyhcIkNsaWVudCA6OiBDbGllbnQgZGlzY29ubmVjdGVkIGZyb20gcG9ydCA6IFwiK2dhbWVwb3J0KTsgLy9HbG9iYWxcbiAgIC8vQ2xlYXIgYWxsIHJlbW90ZSBwbGF5ZXJzL2dhbWUgb2JqZWN0c1xuXG4gICAvL0NsZWFyIHJlbW90ZSBQbGF5ZXJzXG4gICBmb3IoIGkgPSAwOyBpIDwgcmVtb3RlUGxheWVycy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICBjdXJyZW50ID0gcmVtb3RlUGxheWVyc1tpXTtcbiAgICAgICAgIGN1cnJlbnQucmVtb3ZlKHN0YWdlKTtcbiAgIH1cbiAgIHJlbW90ZVBsYXllcnMgPSBbXTtcblxufVxuXG5mdW5jdGlvbiBvbk5ld1BsYXllcihkYXRhKSB7XG4gICBjb25zb2xlLmxvZyhcIkNsaWVudCA6OiBOZXcgcGxheWVyIFwiK2RhdGEuaWQrXCJjb25uZWN0ZWQgb24gcG9ydCA6IFwiK2dhbWVwb3J0KTtcblxuICAgXG4gICB2YXIgbmV3UGxheWVyID0gbmV3IFBsYXllcih7eDogZGF0YS54LCB5OiBkYXRhLnl9KTsgLy9UT0RPIHJld3JpdGUgcGxheWVyIFxuXG4gICBuZXdQbGF5ZXIuaWQgPSBkYXRhLmlkO1xuICAgbmV3UGxheWVyLmFkZChzdGFnZSk7IC8vc3RhZ2UgPSBjdXJyZW50IHN0YWdlIGdsb2JhbFxuICAgcmVtb3RlUGxheWVycy5wdXNoKG5ld1BsYXllcik7XG5cbn1cblxuZnVuY3Rpb24gb25Nb3ZlUGxheWVyKGRhdGEpIHtcbiAgIHZhciBtb3ZlUGxheWVyID0gcGxheWVyQnlJZChkYXRhLmlkKTtcblxuICAgaWYoIW1vdmVQbGF5ZXIpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IFBsYXllciBub3QgZm91bmQ6IFwiICsgZGF0YS5pZCk7XG4gICAgICByZXR1cm47XG4gICB9XG5cbiAgIG1vdmVQbGF5ZXIuc2V0UG9zKHt4OiBkYXRhLngsIHk6IGRhdGEueX0pO1xufVxuXG5mdW5jdGlvbiBvblJlbW92ZVBsYXllcihkYXRhKSB7XG4gICB2YXIgcmVtb3ZlUGxheWVyID0gcGxheWVyQnlJZChkYXRhLmlkKTtcblxuICAgaWYoIXJlbW92ZVBsYXllcikge1xuICAgICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogUGxheWVyIG5vdCBmb3VuZDogXCIrZGF0YS5pZCk7XG4gICAgICByZXR1cm47XG4gICB9O1xuXG4gICAvL1JlbW92ZSB0aGUgcGxheWVyIGZyb20gcmVtb3RlcGxheWVycyBhcnJheVxuICAgcmVtb3ZlUGxheWVyLnJlbW92ZShzdGFnZSk7IC8vR2xvYmFsIHN0YWdlXG4gICByZW1vdGVQbGF5ZXJzLnNwbGljZShyZW1vdGVQbGF5ZXJzLmluZGV4T2YocmVtb3ZlUGxheWVyKSwxKTtcbn1cblxuLy8gTXVsdGlwbGF5ZXIgSGVscGVyIEZ1bmN0aW9ucyBcbmZ1bmN0aW9uIHBsYXllckJ5SWQoaWQpe1xuICAgdmFyIGkgO1xuICAgZm9yKCBpID0gMDsgaSA8IHJlbW90ZVBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKHJlbW90ZVBsYXllcnNbaV0uaWQgPT0gaWQpXG4gICAgICAgICAgICByZXR1cm4gcmVtb3RlUGxheWVyc1tpXTtcbiAgIH07XG5cbiAgIHJldHVybiBmYWxzZTtcbn1cblxuXG4iXX0=
