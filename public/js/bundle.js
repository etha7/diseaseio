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
canvas.height = window.innerHeight - window.innerHeight/3; 
//make canvas smaller, so divs at the top don't require scrolling

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
      stage.canvas.height = window.innerHeight - window.innerHeight/3;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInB1YmxpYy9qcy9DbGFzc2VzLmpzIiwicHVibGljL2pzL21haW5HYW1lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vL1V0aWxpdHkgZnVuY3Rpb25zOi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vL1V0aWxpdHkgZnVuY3Rpb24gZm9yIGNvbXBhcmluZyBhcnJheXMgZm9yIGVxdWFsaXR5XG5BcnJheS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24oIGFycmF5ICkge1xuICByZXR1cm4gdGhpcy5sZW5ndGggPT0gYXJyYXkubGVuZ3RoICYmIFxuICAgICAgICAgICB0aGlzLmV2ZXJ5KCBmdW5jdGlvbih0aGlzX2ksaSkgeyByZXR1cm4gdGhpc19pID09IGFycmF5W2ldIH0gKSAgXG59XG5cblxuLy9VdGlsaXR5IGZ1bmN0aW9uczpeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cblxuXG4vL0NsYXNzIGRlZmluaXRpb25zOi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vL0Jhc2UgY2xhc3MgZm9yIGFsbCBwcmltaXRpdmUgb2JqZWN0cyB0aGF0IGdldCBkcmF3blxuZnVuY3Rpb24gRWFzZWxPYmplY3QoIHBvcywgY29sb3Ipe1xuXG4gICB0aGlzLmVhc2VsU2hhcGUgPSBuZXcgY3JlYXRlanMuU2hhcGUoKTtcbiAgIHRoaXMuZ2V0RWFzZWxTaGFwZSA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmVhc2VsU2hhcGU7IH07XG5cbiAgIC8vU2V0IGluaXRpYWwgcG9zaXRpb25cbiAgIHRoaXMuZWFzZWxTaGFwZS54ID0gcG9zLng7XG4gICB0aGlzLmVhc2VsU2hhcGUueSA9IHBvcy55O1xuXG4gICAvL1Bvc2l0aW9uIHNldHRlcnMgYW5kIGdldHRlcnNcbiAgIHRoaXMuZ2V0UG9zID0gZnVuY3Rpb24oKSB7IHJldHVybiB7eDogdGhpcy5nZXRFYXNlbFNoYXBlKCkueCwgeTogdGhpcy5nZXRFYXNlbFNoYXBlKCkueX07IH07XG4gICB0aGlzLnNldFBvcyA9IGZ1bmN0aW9uKHBvcykgeyB0aGlzLmdldEVhc2VsU2hhcGUoKS54ID0gcG9zLng7IHRoaXMuZ2V0RWFzZWxTaGFwZSgpLnkgPSBwb3MueTt9O1xuXG4gICAvL1RoZSBvYmplY3QncyBjb2xvclxuICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuXG4gICAvL0FkZHMgdGhlIGN1cnJlbnQgb2JqZWN0IHRvIHRoZSBzdGFnZVxuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihzdGFnZSkge1xuICAgICAgc3RhZ2UuYWRkQ2hpbGQodGhpcy5nZXRFYXNlbFNoYXBlKCkpO1xuICAgICAgc3RhZ2UudXBkYXRlKCk7XG4gICB9O1xuXG4gICAvL1JlbW92ZXMgdGhlIGN1cnJlbnQgb2JqZWN0IGZyb20gdGhlIHN0YWdlXG4gICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICBzdGFnZS5yZW1vdmVDaGlsZCh0aGlzLmdldEVhc2VsU2hhcGUoKSk7XG4gICB9O1xufVxuXG4vL0EgY2xhc3MgZm9yIHJlcHJlc2VudGluZyBjaXJjbGVzXG5mdW5jdGlvbiBDaXJjbGUocG9zLCBjb2xvciwgcmFkaXVzICl7XG4gICAvL0NhbGwgY29uc3RydWN0b3Igb2Ygc3VwZXJjbGFzc1xuICAgRWFzZWxPYmplY3QuY2FsbCh0aGlzLCBwb3MsIGNvbG9yKTsgIFxuXG4gICAvL1NldCB0aGUgbmV3IHJhZGl1c1xuICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XG5cbiAgIC8vRnVuY3Rpb246IGRyYXcgYSBjaXJjbGVcbiAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5iZWdpbkZpbGwodGhpcy5jb2xvcikuZHJhd0NpcmNsZSgwLDAsdGhpcy5yYWRpdXMpO1xuICAgfVxuXG4gICAvL0Z1bmN0aW9uOiBkcmF3IGEgZG90dGVkIGNpcmNsZVxuICAgdGhpcy5kcmF3RG90dGVkID0gZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5jbGVhcigpO1xuXG4gICAgICAvLzIwIHBpeGVsIGxpbmVzIHdpdGggNSBwaXhlbCBnYXBzXG4gICAgICAvL3RoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5zZXRTdHJva2VEYXNoKFsyMCw1XSk7XG4gICAgICB0aGlzLmVhc2VsU2hhcGUuZ3JhcGhpY3Muc2V0U3Ryb2tlU3R5bGUoMikuYmVnaW5TdHJva2UodGhpcy5jb2xvcikuZHJhd0NpcmNsZSgwLDAsdGhpcy5yYWRpdXMpO1xuICAgfVxuICAgIFxuICAgdGhpcy5kcmF3KCk7XG59XG5cbmZ1bmN0aW9uIFJlY3RhbmdsZShwb3MsIGNvbG9yLCB3aWR0aCwgaGVpZ2h0KXtcbiAgIEVhc2VsT2JqZWN0LmNhbGwodGhpcywgcG9zLCBjb2xvcik7XG5cbiAgIHRoaXMud2lkdGggID0gd2lkdGg7XG4gICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuXG4gICAvL0Vhc2VsLmpzIGRyYXdzIHJlY3RhbmdsZXMgdXNpbmcgY29vcmRpbmF0ZXMgcmVwcmVzZW50aW5nIHRoZSByZWN0YW5nbGUncyB1cHBlciBsZWZ0IGNvcm5lclxuICAgLy9UaGUgcG9zaXRpb24gb2Zmc2V0cyBoZXJlIGRyYXcgdGhlIHJlY3RhbmdsZSBzdWNoIHRoYXQgcG9zIHJlcHJlc2VudHMgdGhlIGNlbnRlciBpZiBpdC4gXG4gICB0aGlzLmVhc2VsU2hhcGUueCAtPSAgdGhpcy53aWR0aC8yXG4gICB0aGlzLmVhc2VsU2hhcGUueSAtPSAgdGhpcy5oZWlnaHQvMlxuICAgXG4gICAvL0RyYXcgdGhlIHJlY3RhbmdsZVxuICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24oKXtcbiAgICAgIHRoaXMuZWFzZWxTaGFwZS5ncmFwaGljcy5jbGVhcigpO1xuICAgICAgdGhpcy5nZXRFYXNlbFNoYXBlKCkuZ3JhcGhpY3MuYmVnaW5GaWxsKHRoaXMuY29sb3IpLmRyYXdSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgIH1cbiAgIHRoaXMuZHJhdygpO1xuXG59XG5cbmZ1bmN0aW9uIFJlc291cmNlKHZhbHVlKXtcbiAgIENpcmNsZS5jYWxsKHRoaXMsIHt4OiAwLCB5OiAwfSwgXCJ3aGl0ZVwiLCAxMCk7XG4gICB0aGlzLnZhbHVlID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIERpc2Vhc2Vab25lKHBsYXllclBvcyl7XG4gICBDaXJjbGUuY2FsbCh0aGlzLCBwbGF5ZXJQb3MsIFwicmVkXCIsIDc1KTtcbiAgIHRoaXMuZHJhd0RvdHRlZCgpO1xuICAgdGhpcy5BbGxvd3NUZWFtcyA9IGZhbHNlO1xuXG4gICAvL0ludmVydHMgd2hldGhlciB0aGUgZGlzZWFzZVpvbmUgYWxsb3dzIHRlYW1zXG4gICAvL1RPRE8gbWFrZSBwcm9wZXJ0eSBvZiBwbGF5ZXJcbiAgIHRoaXMuaW52ZXJ0QWxsb3dzVGVhbXMgPSBmdW5jdGlvbigpe1xuXG4gICAgIC8vU2V0IHRvIG5vdCBhbGxvdyB0ZWFtc1xuICAgICBpZih0aGlzLkFsbG93c1RlYW1zID09PSB0cnVlKXtcbiAgICAgICAgdGhpcy5jb2xvciA9IFwicmVkXCI7XG4gICAgICAgIHRoaXMuZHJhd0RvdHRlZCgpO1xuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICB0aGlzLmNvbG9yID0gXCJncmVlblwiO1xuICAgICAgICB0aGlzLmRyYXdEb3R0ZWQoKTtcbiAgICAgfVxuICAgICB0aGlzLkFsbG93c1RlYW1zID0gIXRoaXMuQWxsb3dzVGVhbXM7XG4gICB9O1xuICAgXG59XG5cbmZ1bmN0aW9uIENhbWVyYShwb3MsIHdpZHRoLCBoZWlnaHQpe1xuICAgdGhpcy5wb3MgPSBwb3M7XG4gICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgIHRoaXMuZ2V0UG9zID0gZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5wb3M7fTtcbiAgIHRoaXMuc2V0UG9zID0gZnVuY3Rpb24ocG9zKSB7dGhpcy5wb3MgPSBwb3M7fTtcbiAgIHRoaXMuZ2V0V2lkdGggPSBmdW5jdGlvbigpe3JldHVybiB0aGlzLndpZHRoO307XG4gICB0aGlzLnNldFdpZHRoID0gZnVuY3Rpb24od2lkdGgpIHt0aGlzLndpZHRoID0gd2lkdGg7fTtcbiAgIHRoaXMuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5oZWlnaHQ7fTtcbiAgIHRoaXMuc2V0SGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7dGhpcy5oZWlnaHQgPSBoZWlnaHQ7fTtcbn1cblxuZnVuY3Rpb24gUGxheWVyKHBvcyl7XG4gICBDaXJjbGUuY2FsbCggdGhpcywgcG9zLCBcInJlZFwiLCAyMCk7XG4gICAgLy97eDogY2FudmFzLndpZHRoLzIsIHk6IGNhbnZhcy5oZWlnaHQvMn0sIFwicmVkXCIsIDIwKTtcbiAgIFxuXG4gICB0aGlzLmlkO1xuICAgdGhpcy5kaXNlYXNlWm9uZSA9IG5ldyBEaXNlYXNlWm9uZSh0aGlzLmdldFBvcygpKTtcbiAgIHRoaXMucmVzb3VyY2VzID0gMDtcbiAgIHRoaXMuY2FtZXJhID0ge307XG4gICB0aGlzLnBhdGggPSBbXTtcblxuICAgLy90aGlzLmdldENhbWVyYSA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLmNhbWVyYTt9O1xuICAgLy90aGlzLnNldENhbWVyYSA9IGZ1bmN0aW9uKGNhbWVyYSl7IHRoaXMuY2FtZXJhID0gY2FtZXJhOyB9O1xuICAgXG4gICAvL01vdmVzIHRoZSBwbGF5ZXIgYWxvbmcgYSBwYXRoIGRldGVybWluZWQgYnkgQSogYWxnb3JpdGhtXG4gICB0aGlzLmdvUGF0aCA9IGZ1bmN0aW9uKGRlbHRhVGltZSl7XG4gICAgICBcbiAgICAgIGlmKHRoaXMucGF0aC5lcXVhbHMoW10pID09PSBmYWxzZSlcbiAgICAgIHtcbiAgICAgICAgIHZhciBwb3MgPSB7eDogdGhpcy5wYXRoWzBdLngsIHk6IHRoaXMucGF0aFswXS55fTtcbiAgICAgICAgIHRoaXMuc2V0UG9zKHBvcyk7XG4gICAgICAgICB0aGlzLnBhdGguc3BsaWNlKDAsIDEqZGVsdGFUaW1lKTsgLy9SZW1vdmUgZGVsdGFUaW1lIGVsZW1lbnRzIHN0YXJ0aW5nIGZyb20gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vZWxlbWVudCAwO1xuICAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgIH1cbiAgICAgdmFyIHBvcyA9IHt4OiB0aGlzLmdldFBvcygpLngsIHk6IHRoaXMuZ2V0UG9zKCkueX07IFxuICAgICAgcmV0dXJuIHBvcztcbiAgIH1cblxuICAgdGhpcy5nZXRSZXNvdXJjZXMgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpcy5yZXNvdXJjZXM7fTtcbiAgIHRoaXMuc2V0UmVzb3VyY2VzID0gZnVuY3Rpb24obmV3UmVzb3VyY2VzKXsgdGhpcy5yZXNvdXJjZXMgPSBuZXdSZXNvdXJjZXN9O1xuXG4gICAvL092ZXJyaWRlIGluaGVyaXRlZCBzZXRQb3NcbiAgIHZhciBwYXJlbnRTZXRQb3MgPSB0aGlzLnNldFBvcztcbiAgIHRoaXMuc2V0UG9zID0gZnVuY3Rpb24ocG9zKXsgXG4gICAgICAgLy90aGlzLmNhbWVyYS5zZXRQb3MocG9zKTtcbiAgICAgICB0aGlzLmRpc2Vhc2Vab25lLnNldFBvcyhwb3MpO1xuICAgICAgIHBhcmVudFNldFBvcy5jYWxsKHRoaXMsIHBvcyk7IC8vbmVlZCBjYWxsIHNvICd0aGlzJyBpcyBkZWZpbmVkIGFzIHRoZSBjdXJyZW50IFBsYXllclxuICAgfTtcbiAgIHRoaXMuc2V0UG9zKHBvcyk7XG5cbiAgIC8vT3ZlcnJpZGUgaW5oZXJpdGVkIGFkZFxuICAgdmFyIHBhcmVudEFkZCA9IHRoaXMuYWRkO1xuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihzdGFnZSl7XG4gICAgICB0aGlzLmRpc2Vhc2Vab25lLmFkZChzdGFnZSk7XG4gICAgICBwYXJlbnRBZGQuY2FsbCh0aGlzLCBzdGFnZSk7XG4gICB9XG5cbiAgIHZhciBwYXJlbnRSZW1vdmUgPSB0aGlzLnJlbW92ZTtcbiAgIHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oc3RhZ2Upe1xuICAgICAgdGhpcy5kaXNlYXNlWm9uZS5yZW1vdmUoc3RhZ2UpO1xuICAgICAgcGFyZW50UmVtb3ZlLmNhbGwodGhpcywgc3RhZ2UpO1xuICAgfVxuICAgICAgXG4gICAvL0NoZWNrIGlmIHN0YW5kaW5nIG9uIGFueSByZXNvdXJjZXNcbiAgIHRoaXMucGlja3VwID0gZnVuY3Rpb24oc3RhZ2UsIHJlc291cmNlcyl7XG4gICAgICB2YXIgZWFzZWxTaGFwZSA9IHRoaXMuZ2V0RWFzZWxTaGFwZSgpO1xuICAgICAgdmFyIHJlc291cmNlQ29weSA9IHJlc291cmNlcy5zbGljZSgwLHJlc291cmNlcy5sZW5ndGgpO1xuICAgICAgLy9mb3IgKHZhciB4IG9mIHJlc291cmNlQ29weSl7XG4gICAgICBmb3IoIGkgPSAwOyBpIDwgcmVzb3VyY2VDb3B5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgIHZhciB4ID0gcmVzb3VyY2VDb3B5W2ldOyAvL2N1cnJlbnQgcmVzb3VyY2VcblxuICAgICAgICAgdmFyIHBvcyA9IHguZ2V0UG9zKCk7XG4gICAgICAgICB2YXIgcHQgPSAgZWFzZWxTaGFwZS5nbG9iYWxUb0xvY2FsKHBvcy54LCBwb3MueSk7IC8vaGl0VGVzdCBuZWVkcyBjb29yZGluYXRlcyByZWxhdGl2ZSB0byBlYXNlbFNoYXBlXG4gICAgICAgICBpZihlYXNlbFNoYXBlLmhpdFRlc3QocHQueCwgcHQueSkpIC8vSWYgcGxheWVyIGlzIG92ZXIgcmVzb3VyY2VcbiAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2V0UmVzb3VyY2VzKHRoaXMuZ2V0UmVzb3VyY2VzKCkgKyB4LnZhbHVlKTtcbiAgICAgICAgICAgIHZhciByZW1JbmRleCA9IHJlc291cmNlcy5pbmRleE9mKHgpO1xuICAgICAgICAgICAgcmVzb3VyY2VzLnNwbGljZShyZW1JbmRleCwxKTtcbiAgICAgICAgICAgIHgucmVtb3ZlKHN0YWdlKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cbn1cblxuLy9Db250cm9scyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy9DcmVhdGVzIGEgSm95c3RpY2sgYXQgdGhlIGdpdmVuIGxvY2F0aW9uXG5mdW5jdGlvbiBKb3lzdGljayhwb3MsIHBsYXllcil7XG5cbiAgIHRoaXMucG9zID0gcG9zO1xuICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cbiAgIHRoaXMuYmFzZVNpemUgPSAzNTtcbiAgIHRoaXMuYmFzZUNvbG9yID0gXCJncmV5XCI7XG4gICB0aGlzLmJhc2UgPSBuZXcgQ2lyY2xlKHRoaXMucG9zLCB0aGlzLmJhc2VDb2xvciwgdGhpcy5iYXNlU2l6ZSk7XG5cbiAgIHRoaXMuc3RpY2tTaXplID0gMjU7XG4gICB0aGlzLnN0aWNrQ29sb3IgPSBcIndoaXRlXCI7XG4gICB0aGlzLnN0aWNrID0gIG5ldyBDaXJjbGUodGhpcy5wb3MsIHRoaXMuc3RpY2tDb2xvciwgdGhpcy5zdGlja1NpemUpO1xuXG4gICAvL1ByZXZlbnQgc2Nyb2xsaW5nXG4gICB0aGlzLnN0aWNrLmdldEVhc2VsU2hhcGUoKS5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKXtcbiAgIH0pO1xuXG4gICAvL0xpbWl0ZWQgRHJhZ2dpbmdcbiAgIHRoaXMuc3RpY2suZ2V0RWFzZWxTaGFwZSgpLm9uKFwicHJlc3Ntb3ZlXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgZS50YXJnZXQueCA9IGUuc3RhZ2VYOyAvLyhzdGFnZVgsIHN0YWdlWSkgPSBtb3VzZUNvb3JkaW5hdGVcbiAgICAgIGUudGFyZ2V0LnkgPSBlLnN0YWdlWTtcbiAgIH0pO1xuICAgXG4gICB2YXIgYmFzZVZhciA9IHRoaXMuYmFzZTsgLy9ObyBpZGVhIHdoeSBJIGhhdmUgdG8gZG8gdGhpczsgc2NvcGluZz9cbiAgIC8vUmVzZXQgc3RpY2sgdG8gYmFzZSBwb3RpdGlvbiBvbiB3aGVuIGpveXN0aWNrIGlzIHJlbGVhc2VkXG4gICB0aGlzLnN0aWNrLmdldEVhc2VsU2hhcGUoKS5vbihcInByZXNzdXBcIiwgZnVuY3Rpb24oZSl7XG4gICAgICBlLnRhcmdldC54ID0gYmFzZVZhci5nZXRQb3MoKS54OyAgXG4gICAgICBlLnRhcmdldC55ID0gYmFzZVZhci5nZXRQb3MoKS55O1xuICAgfSk7XG4gICBcbiAgIHRoaXMuZ2V0UG9zID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmJhc2UuZ2V0UG9zKCl9O1xuICAgdGhpcy5zZXRQb3MgPSBmdW5jdGlvbihwb3MpIHtcbiAgICAgIHRoaXMuYmFzZS5zZXRQb3MocG9zKTtcbiAgICAgIHRoaXMuc3RpY2suc2V0UG9zKHBvcyk7XG4gICB9XG5cbiAgIC8vR2V0IHRoZSBkaXJlY3Rpb24gdGhlIGpveXN0aWNrIGlzIHBvaW50aW5nXG4gICB0aGlzLmdldERpcmVjdGlvbiA9IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgdiA9IHRoaXMuc3RpY2suZ2V0UG9zKCk7XG4gICAgICB2YXIgdyA9IHRoaXMuYmFzZS5nZXRQb3MoKTtcbiAgICAgIHZhciB4MSA9IHYueCAtIHcueDsgLy9uZXcgY29vcmRpbmF0ZXNcbiAgICAgIHZhciB5MSA9IHYueSAtIHcueTtcbiAgICAgIHZhciBtYWcxID0gTWF0aC5zcXJ0KHgxKngxICsgeTEqeTEpO1xuXG4gICAgICByZXR1cm4ge3g6IHgxL21hZzEsIHk6IHkxL21hZzF9XG4gICB9O1xuXG4gICAvL0dldCB0aGUgZm9yY2UgYWN0aW5nIG9uIGEgcGxheWVyIGJ5IHRoZSBqb3lzdGlja1xuICAgdGhpcy5nZXRGb3JjZSA9IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgdiA9IHRoaXMuc3RpY2suZ2V0UG9zKCk7XG4gICAgICB2YXIgdyA9IHRoaXMuYmFzZS5nZXRQb3MoKTtcbiAgICAgIHJldHVybiBNYXRoLmFicyhNYXRoLnNxcnQodi54KnYueCArIHYueSp2LnkpIC0gTWF0aC5zcXJ0KHcueCp3LnggKyB3Lnkqdy55KSk7XG4gICB9O1xuXG5cbiAgIC8vVXBkYXRlIHBsYXllcidzIGxvY2F0aW9uIHdpdGggcmVzcGVjdCB0byBqb3lzdGlja1xuICAgdGhpcy5tb3ZlID0gZnVuY3Rpb24gKGRlbHRhKSB7IC8vRGVsdGEgaXMgZGVsdGFUaW1lXG5cbiAgICAgIC8vTW92ZSBwbGF5ZXIgd2l0aCBsZWZ0IGpveXN0aWNrXG4gICAgICB2YXIgcGxheWVyUG9zID0gdGhpcy5wbGF5ZXIuZ2V0UG9zKCk7XG4gICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcblxuICAgICAgLy9UT0RPIG1ha2UgZGFtcGluZyBwbGF5ZXIgcHJvcGVydHlcbiAgICAgIHZhciBkYW1waW5nID0gMS8yMDtcbiAgICAgIGlmKGlzTmFOKGRpcmVjdGlvbi54KSB8fCBpc05hTihkaXJlY3Rpb24ueSkpXG4gICAgICB7XG4gICAgICAgICBkaXJlY3Rpb24ueCA9IDA7XG4gICAgICAgICBkaXJlY3Rpb24ueSA9IDA7XG4gICAgICB9XG4gICAgICBwbGF5ZXJQb3MueCArPSBkYW1waW5nKmRlbHRhKnRoaXMuZ2V0Rm9yY2UoKSpkaXJlY3Rpb24ueDtcbiAgICAgIHBsYXllclBvcy55ICs9IGRhbXBpbmcqZGVsdGEqdGhpcy5nZXRGb3JjZSgpKmRpcmVjdGlvbi55O1xuICAgICAgdGhpcy5wbGF5ZXIuc2V0UG9zKHBsYXllclBvcyk7XG5cbiAgIH07XG5cblxuICAgdGhpcy5hZGQgPSBmdW5jdGlvbihzdGFnZSl7XG4gICAgICBzdGFnZS5hZGRDaGlsZCh0aGlzLmJhc2UuZ2V0RWFzZWxTaGFwZSgpKTtcbiAgICAgIHN0YWdlLmFkZENoaWxkKHRoaXMuc3RpY2suZ2V0RWFzZWxTaGFwZSgpKTtcbiAgICAgIHN0YWdlLnVwZGF0ZSgpO1xuICAgfVxuXG59XG5cbi8vQnV0dG9uIGZvciBvcHRpbmcgaW4gb3Igb3V0IG9mIHRlYW1zXG5mdW5jdGlvbiBUZWFtQnV0dG9uKHBvcywgY29sb3IsIHBsYXllcil7XG5cbiAgIC8vVE9ETyBtYWtlIGJhc2VTaXplIHNvbWUga2luZCBvZiBnbG9iYWwgdmFyaWFibGVcbiAgIHZhciBiYXNlU2l6ZSA9IDM1O1xuICAgQ2lyY2xlLmNhbGwodGhpcywgcG9zLCBjb2xvciwgYmFzZVNpemUpO1xuXG4gICB0aGlzLnBsYXllciA9IHBsYXllcjtcblxuICAgdGhpcy5nZXRFYXNlbFNoYXBlKCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKXtcbiAgICAgIHBsYXllci5kaXNlYXNlWm9uZS5pbnZlcnRBbGxvd3NUZWFtcygpO1xuICAgfSk7XG59XG4vL0NvbnRyb2xzIF5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuXG4vL0RyYWdhYmxlIENsYXNzOiBNYWtlcyBvYmplY3RzIERyYWdhYmxlXG5mdW5jdGlvbiBEcmFnYWJsZShwb3MsIGNvbG9yKXtcblxuICAgLy9DYWxsIHN1cGVyY2xhc3MncyBjb25zdHJ1Y3RvclxuICAgRWFzZWxPYmplY3QuY2FsbCh0aGlzLCBwb3MsIGNvbG9yKTtcblxuICAgLy9VcGRhdGUgY29vcmRpbmF0ZXMgd2hpbGUgb2JqZWN0IGlzIG1vdmVkIHdoaWxlIHByZXNzZWRcbiAgIHRoaXMuZ2V0RWFzZWxTaGFwZSgpLm9uKFwicHJlc3Ntb3ZlXCIsIGZ1bmN0aW9uKGUpe1xuICAgICAgZS50YXJnZXQueCA9IGUuc3RhZ2VYOyAvLyhzdGFnZVgsIHN0YWdlWSkgPSBtb3VzZUNvb3JkaW5hdGVcbiAgICAgIGUudGFyZ2V0LnkgPSBlLnN0YWdlWTtcbiAgIH0pO1xuXG59O1xuXG5cblxuXG4vL0NsYXNzIGRlZmluaXRpb25zOl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuZXhwb3J0cy5FYXNlbE9iamVjdCA9IEVhc2VsT2JqZWN0O1xuZXhwb3J0cy5DaXJjbGUgICAgICA9IENpcmNsZTtcbmV4cG9ydHMuUmVjdGFuZ2xlICAgPSBSZWN0YW5nbGU7XG5leHBvcnRzLlJlc291cmNlICAgID0gUmVzb3VyY2U7XG5leHBvcnRzLkNhbWVyYSAgICAgID0gQ2FtZXJhO1xuZXhwb3J0cy5EaXNlYXNlWm9uZSA9IERpc2Vhc2Vab25lO1xuZXhwb3J0cy5QbGF5ZXIgICAgICA9IFBsYXllcjtcbmV4cG9ydHMuSm95c3RpY2sgICAgPSBKb3lzdGljaztcbmV4cG9ydHMuVGVhbUJ1dHRvbiAgPSBUZWFtQnV0dG9uO1xuIiwiLyogSU1QT1JUQU5UOiBTZXZlcmFsIHZhcmlhYmxlcyBpbiB0aGlzIGpzLCBsaWtlIFwiaW9cIiwgZXhpc3QgYmVjYXVzZVxuICAgbWFpbkdhbWUuanMgaXMgaW5jbHVkZWQgYmVsb3cgc29ja2V0LmlvLmpzIGluIHZpZXdzL2NpdGl6ZW4uaGFuZGxlYmFycy5cbiAgICAqL1xuXG5cbi8qIEltcG9ydCBjbGFzc2VzICovXG5cbi8vUmVxdWlyaW5nIGVuYWJsZWQgYnkgYnJvd3NlcmlmeVxuXG52YXIgRWFzZWxPYmplY3QgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkVhc2VsT2JqZWN0O1xudmFyIENpcmNsZSAgICAgID0gcmVxdWlyZShcIi4vQ2xhc3Nlc1wiKS5DaXJjbGU7XG52YXIgUmVjdGFuZ2xlICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlJlY3RhbmdsZTtcbnZhciBSZXNvdXJjZSAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuUmVzb3VyY2U7XG52YXIgQ2FtZXJhICAgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLkNhbWVyYTtcbnZhciBEaXNlYXNlWm9uZSA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuRGlzZWFzZVpvbmU7XG52YXIgUGxheWVyICAgICAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlBsYXllcjtcbnZhciBKb3lzdGljayAgICA9IHJlcXVpcmUoXCIuL0NsYXNzZXNcIikuSm95c3RpY2s7XG52YXIgVGVhbUJ1dHRvbiAgPSByZXF1aXJlKFwiLi9DbGFzc2VzXCIpLlRlYW1CdXR0b247XG5cblxudmFyIGdhbWVwb3J0ID0gODA4MDsgLy9wb3J0IGNsaWVudHMgd2lsbCBjb25uZWN0IHRvIFxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpbkNhbnZhc1wiKTtcbnZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbmNhbnZhcy53aWR0aCAgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB3aW5kb3cuaW5uZXJIZWlnaHQvMzsgXG4vL21ha2UgY2FudmFzIHNtYWxsZXIsIHNvIGRpdnMgYXQgdGhlIHRvcCBkb24ndCByZXF1aXJlIHNjcm9sbGluZ1xuXG52YXIgc3RhZ2UgICAgICAgID0gbmV3IGNyZWF0ZWpzLlN0YWdlKFwibWFpbkNhbnZhc1wiKTtcblxudmFyIHBsYXllcixcbiAgICByZW1vdGVQbGF5ZXJzLFxuICAgIGRlbHRhVGltZSxcbiAgICBzb2NrZXQ7XG5cbm1haW4oKTtcblxuXG5mdW5jdGlvbiBtYWluKCl7XG4gICBcbiAgIC8vSW5pdGlhbGl6ZSB0aGUgZ2FtZSB3b3JsZFxuICAgdmFyIHdvcmxkICAgICAgICA9IGluaXRXb3JsZCgpO1xuICAgdmFyIGJhY2tncm91bmQgICA9IGluaXRCYWNrZ3JvdW5kKHN0YWdlLCBjYW52YXMpO1xuXG4gICBcbiAgIC8vSW5pdGFsaXplIHRoZSBnYW1lIGNvbnRyb2xzIGFuZCBwbGF5ZXJcbiAgIHBsYXllciAgICAgICAgICAgPSBpbml0UGxheWVyKHN0YWdlKTtcbiAgIC8vcGxheWVyLnNldENhbWVyYShuZXcgQ2FtZXJhKHBsYXllci5nZXRQb3MoKSwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XG4gICB2YXIgbGVmdEpveXN0aWNrID0gaW5pdEpveXN0aWNrcyhzdGFnZSwgcGxheWVyKS5sZWZ0O1xuICAgdmFyIHRlYW1CdXR0b24gICA9IGluaXRUZWFtQnV0dG9uKHN0YWdlLCBwbGF5ZXIpO1xuXG4gICAvL0luaXRpYWxpemUgYXJyYXkgb2YgcmVzb3VyY2Ugb2JqZWN0cyBhbmQgcmVzb3VyY2UgdGV4dFxuICAgdmFyIHJlc291cmNlcyAgICA9IGluaXRSZXNvdXJjZXMoc3RhZ2UsIGNhbnZhcyk7XG4gICB2YXIgcmVzb3VyY2VUZXh0ID0gaW5pdFJlc291cmNlVGV4dChzdGFnZSxjYW52YXMsIHBsYXllcik7XG5cbiAgIC8vSW5pdGlhbGl6ZSBQYXRoZmluZGluZ1xuICAgdmFyIGVhc3lzdGFyID0gaW5pdFBhdGhmaW5kaW5nKHdvcmxkLCBwbGF5ZXIsIGJhY2tncm91bmQpOyBcbiAgIFxuICAgLy9FbmFibGUgdG91Y2ggYmFzZWQgaW50ZXJmYWNlIGZvciBtb2JpbGUgZGV2aWNlc1xuICAgY3JlYXRlanMuVG91Y2guZW5hYmxlKHN0YWdlKTtcblxuICAgLy9SZXNpemUgY2FudmFzIG9uIHdpbmRvdyByZXNpemUgICBcbiAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uKCl7XG4gICAgICBzdGFnZS5jYW52YXMud2lkdGggID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICBzdGFnZS5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IC0gd2luZG93LmlubmVySGVpZ2h0LzM7XG4gICAgICBiYWNrZ3JvdW5kLndpZHRoICAgID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICBiYWNrZ3JvdW5kLmhlaWdodCAgID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgYmFja2dyb3VuZC5kcmF3KCk7XG5cbiAgICAgIC8vVE9ETyBlbmNhcHN1bGF0ZSB0aGVzZSBvZmZzZXRzIHdpdGhpbiBKb3lzdGljayBhbmQgVGVhbUJ1dHRvblxuICAgICAgbGVmdEpveXN0aWNrLnNldFBvcyh7eDogd2luZG93LmlubmVyV2lkdGgvNiwgeTogd2luZG93LmlubmVySGVpZ2h0LzJ9KTtcbiAgICAgIHRlYW1CdXR0b24uc2V0UG9zKHt4OiB3aW5kb3cuaW5uZXJXaWR0aCAtIHdpbmRvdy5pbm5lcldpZHRoLzYsIHk6IHdpbmRvdy5pbm5lckhlaWdodC8yfSk7XG5cblxuICAgfSwgZmFsc2UpO1xuICAgXG5cbiAgIC8qIE11bHRpcGxheWVyIGluaXRpYWxpemF0aW9uIGNvZGUgKi9cbiAgIC8vQ29ubmVjdCBjbGllbnQgdG8gc2VydmVyIFxuICAgc29ja2V0ID0gaW8uY29ubmVjdCgpO1xuICAgXG4gICAvL0luaXRpYWxpemUgcmVtb3RlIHBsYXllcnMgXG4gICByZW1vdGVQbGF5ZXJzID0gW107XG5cbiAgIC8vTGlzdGVuIGZvciBldmVudHNcbiAgIHNldEV2ZW50SGFuZGxlcnMoKTtcblxuXG4gICAvL01haW4gZ2FtZSBsb29wLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgdmFyIEZQUyA9IDUwO1xuICAgY3JlYXRlanMuVGlja2VyLnNldEZQUyhGUFMpO1xuICAgdmFyIHByZXZpb3VzVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICB2YXIgY3VycmVudFRpbWU7XG4gICAvLyBwaXhlbHMvZnJhbWUgKiBmcmFtZXMvc2Vjb25kID0gcGl4ZWxzL3NlY29uZDogZGVsdGEgdGltZSBpc1xuICAgLy8gZW1waXJpY2FsIEZQU1xuICAgY3JlYXRlanMuVGlja2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aWNrXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgIC8vTG9naWMgdG8gY3JlYXRlIGRlbHRhVGltZSBzbyBtb3ZlbWVudCBpcyByZWxhdGl2ZSB0byB0aW1lXG4gICAgICAvL3JhdGhlciB0aGFuIGZyYW1lcy5cbiAgICAgIHZhciB0aW1lciA9IG5ldyBEYXRlKCk7XG4gICAgICBjdXJyZW50VGltZSA9IHRpbWVyLmdldFRpbWUoKTtcbiAgICAgIGRlbHRhVGltZSA9IGN1cnJlbnRUaW1lIC0gcHJldmlvdXNUaW1lO1xuICAgICAgcHJldmlvdXNUaW1lID0gY3VycmVudFRpbWU7XG5cbiAgICAgIC8vRG8gcGF0aGZpbmRpbmcgY2FsY3VsYXRpb25cbiAgICAgIGVhc3lzdGFyLmNhbGN1bGF0ZSgpO1xuXG4gICAgICAvL01vdmUgcGxheWVyIGFjY29yZGluZyB0byBqb3lzdGlja1xuICAgICAgbGVmdEpveXN0aWNrLm1vdmUoZGVsdGFUaW1lKTtcblxuICAgICAgLy9DaGVjayBpZiBwbGF5ZXIgaXMgY29sbGlkaW5nIHdpdGggcmVzb3VyY2VzXG4gICAgICBwbGF5ZXIucGlja3VwKHN0YWdlLCByZXNvdXJjZXMpO1xuXG4gICAgICAvL01vdmUgYWxvbmcgY2FsY3VsYXRlZCBwYXRoZmluZGluZyBwYXRoXG4gICAgICBwYXRoUGxheWVycyhwbGF5ZXIsZGVsdGFUaW1lKTtcblxuICAgICAgLy9VcGRhdGUgcmVzb3VyY2UgdGV4dFxuICAgICAgcmVzb3VyY2VUZXh0LnRleHQgPSBcIlJlc291cmNlczogXCIrcGxheWVyLmdldFJlc291cmNlcygpO1xuXG4gICAgICAvL0NvbW1pdCBhbGwgdXBkYXRlcyB0byBhY3R1YWwgc3RhZ2UvY2FudmFzXG4gICAgICBzdGFnZS51cGRhdGUoKTtcblxuICAgfSk7XG5cbn1cbi8vVXRpbGl0eSBmdW5jdGlvbnM6LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vVXRpbGl0eSBmdW5jdGlvbiBmb3IgY29tcGFyaW5nIGFycmF5cyBmb3IgZXF1YWxpdHlcbkFycmF5LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiggYXJyYXkgKSB7XG4gIHJldHVybiB0aGlzLmxlbmd0aCA9PSBhcnJheS5sZW5ndGggJiYgXG4gICAgICAgICAgIHRoaXMuZXZlcnkoIGZ1bmN0aW9uKHRoaXNfaSxpKSB7IHJldHVybiB0aGlzX2kgPT0gYXJyYXlbaV0gfSApICBcbn1cblxuXG4vL1V0aWxpdHkgZnVuY3Rpb25zOl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlxuXG5mdW5jdGlvbiBwYXRoUGxheWVycyhwbGF5ZXIsZGVsdGFUaW1lKXtcbiAgICAgXG4gICAgICB2YXIgbmV3UGF0aFBvcztcbiAgICAgIHBsYXllci5nb1BhdGgoZGVsdGFUaW1lKTtcbiAgICAgIHNvY2tldC5lbWl0KFwibW92ZSBwbGF5ZXJcIiwgeyAgeDogcGxheWVyLmdldFBvcygpLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBwbGF5ZXIuZ2V0UG9zKCkueSB9KTtcbiAgICAgIGZvcihpID0gMDsgaSA8IHJlbW90ZVBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgIGN1cnJQbGF5ZXIgPSByZW1vdGVQbGF5ZXJzW2ldO1xuICAgICAgICAgbmV3UGF0aFBvcyA9IGN1cnJQbGF5ZXIuZ29QYXRoKGRlbHRhVGltZSk7XG5cbiAgICAgICAgIC8vRWFjaCBwbGF5ZXIgYWxyZWFkeSB1cGRhdGVzIHRoZWlyIG93biBwb3NpdGlvbiBvbiB0aGUgc2VydmVyLFxuICAgICAgICAgLy90aGlzIGNhbGwgaXMgdW5lY2Vzc2FyeVxuICAgICAgICAgLypzb2NrZXQuZW1pdChcIm1vdmUgcGxheWVyXCIsIHsgIHg6IG5ld1BhdGhQb3MueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogbmV3UGF0aFBvcy55IH0pOyovXG4gICAgICB9XG59XG5cbi8vQ3JlYXRlcyBhIHNxdWFyZSB3b3JsZCBvZiBzaXplIDEwMDAgdGhhdCBvdXIgcGF0aGZpbmRpbmcgYWxnb3JpdGhtIGNhbiB1c2VcbmZ1bmN0aW9uIGluaXRXb3JsZCgpe1xuIC8vVE9ETyBtYWtlIHNpemUgb2YgY2FudmFzLCByZXNpemUgd2l0aCBjYW52YXNcbiAgIHZhciBzaXplID0gMTAwMDtcbiAgIHZhciB3b3JsZCA9IFtdXG4gICBmb3IodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKXtcbiAgICAgIHdvcmxkW2ldID0gW11cbiAgICAgIGZvcih2YXIgaiA9IDA7IGogPCBzaXplOyBqKyspe1xuICAgICAgICAgd29ybGRbaV1bal0gPTA7XG4gICAgICB9XG4gICB9XG4gICByZXR1cm4gd29ybGQ7XG59XG5cbi8vQ3JlYXRlcyBhbmQgZGlzcGxheWVzIHRoZSBSZXNvdXJjZXM6IHggdGV4dFxuZnVuY3Rpb24gaW5pdFJlc291cmNlVGV4dChzdGFnZSwgY2FudmFzLCBwbGF5ZXIpe1xuICAgcmVzb3VyY2VUZXh0ID0gbmV3IGNyZWF0ZWpzLlRleHQoXCJSZXNvdXJjZXM6IFwiK3BsYXllci5nZXRSZXNvdXJjZXMoKSwgXCIyMHB4IEFyaWFsXCIsIFwid2hpdGVcIik7XG4gICByZXNvdXJjZVRleHQueCA9IDA7XG4gICByZXNvdXJjZVRleHQueSA9IGNhbnZhcy5oZWlnaHQvMTI7IC8vVE9ETyBtb3JlIGxvZ2ljYWxseSBwb3NpdGlvbiBSZXNvdXJjZXMgdGV4dFxuICAgcmVzb3VyY2VUZXh0LnRleHRCYXNlbGluZSA9IFwiYWxwaGFiZXRcIjsgLy9Ob3Qgc3VyZSB3aGF0IHRoaXMgc2V0dGluZyBkb2VzXG4gICBzdGFnZS5hZGRDaGlsZChyZXNvdXJjZVRleHQpO1xuICAgcmV0dXJuIHJlc291cmNlVGV4dDtcblxufVxuXG4vL0NyZWF0ZXMgYW4gYXJyYXkgb2YgcmFuZG9tbHkgcGxhY2VkIFJlc291cmNlcyBvbiB0aGUgc3RhZ2VcbmZ1bmN0aW9uIGluaXRSZXNvdXJjZXMoc3RhZ2UsIGNhbnZhcyl7XG5cbiAgIHZhciBudW1SZXNvdXJjZXMgPSAzOyAvL1RPRE8gbWFrZSBnbG9iYWwvbWFrZSBsb2dpY2FsIGNob2ljZS4gVG9vIGhpZ2ggYSBudW1iZXIgbWF5IGluY3VyIHJlc291cmNlIHByb2JsZW1zXG4gICB2YXIgY3VyclBvcyA9IHt4OiAwLCB5OiAwfTtcbiAgIHZhciByZXNvdXJjZXMgPSBbXTtcbiAgIHZhciByZXNvdXJjZVZhbHVlID0gMTA7XG5cbiAgIGZvciAoaSA9IDA7IGkgPCBudW1SZXNvdXJjZXM7IGkgKyspe1xuICAgICAgY3VyclBvcy54ID0gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIGNhbnZhcy53aWR0aCkpOyAvL1JhbmRvbSBudW1iZXIgZnJvbSB6ZXJvIHRvIGNhbnZhcy53aWR0aFxuICAgICAgY3VyclBvcy55ID0gTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIGNhbnZhcy5oZWlnaHQpKTtcblxuICAgICAgdmFyIHJlc291cmNlID0gbmV3IFJlc291cmNlKHJlc291cmNlVmFsdWUpO1xuICAgICAgcmVzb3VyY2Uuc2V0UG9zKGN1cnJQb3MpO1xuICAgICAgcmVzb3VyY2UuYWRkKHN0YWdlKTtcbiAgICAgIHJlc291cmNlcy5wdXNoKHJlc291cmNlKTtcbiAgIH1cblxuICAgcmV0dXJuIHJlc291cmNlcztcbn1cblxuLy9DcmVhdGUgYW4gb2JqZWN0IHRvIHJlcHJlc2VudCB0aGUgYmFja2dyb3VuZCBhbmQgcmVnaXN0ZXIgcGF0aGZpbmRpbmcgZXZlbnRzXG5mdW5jdGlvbiBpbml0QmFja2dyb3VuZChzdGFnZSwgY2FudmFzKXtcbiAgIHZhciBjb2xvciA9IFwiYmxhY2tcIjtcbiAgIHZhciB3aWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgIHZhciBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICBcbiAgIFxuICAgdmFyIGJhY2tncm91bmQgPSBuZXcgUmVjdGFuZ2xlKCB7eDogd2lkdGgvMiwgeTogaGVpZ2h0LzJ9LCBjb2xvciwgd2lkdGgsIGhlaWdodCk7XG4gICBiYWNrZ3JvdW5kLmFkZChzdGFnZSk7XG5cbiAgIHJldHVybiBiYWNrZ3JvdW5kO1xuXG59XG5cbi8vQ3JlYXRlIGRlc2lyZWQgSm95c3RpY2tzIGZvciB0aGUgdXNlclxuZnVuY3Rpb24gaW5pdEpveXN0aWNrcyhzdGFnZSwgcGxheWVyKXtcbiAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5DYW52YXNcIik7XG4gICAvL3ZhciByaWdodCAgPSBuZXcgSm95c3RpY2soe3g6Y2FudmFzLndpZHRoIC0gY2FudmFzLndpZHRoLzYsIHk6IGNhbnZhcy5oZWlnaHQvMn0pO1xuICAgdmFyIGxlZnQgPSBuZXcgSm95c3RpY2soe3g6IGNhbnZhcy53aWR0aC82LCB5OiBjYW52YXMuaGVpZ2h0LzJ9LCBwbGF5ZXIpO1xuXG4gICAvL0FkZCB0byBjYW52YXNcbiAgIC8vcmlnaHQuYWRkKHN0YWdlKTtcbiAgIGxlZnQuYWRkKHN0YWdlKTtcblxuICAgcmV0dXJuIHtsZWZ0OiBsZWZ0fTtcbn1cblxuLy9DcmVhdGVzIGEgcGxheWVyIGFuZCBhc3NvY2lhdGVzIGl0IHRvIGEgam95c3RpY2tcbmZ1bmN0aW9uIGluaXRQbGF5ZXIoc3RhZ2Upe1xuXG4gICAvL0luaXQgbG9jYWwgcGxheWVyXG4gICBwbGF5ZXIgPSBuZXcgUGxheWVyKHt4OiBzdGFnZS5jYW52YXMud2lkdGgvMiwgeTogc3RhZ2UuY2FudmFzLmhlaWdodC8yfSk7XG4gICBwbGF5ZXIuYWRkKHN0YWdlKTtcblxuXG4gICByZXR1cm4gcGxheWVyO1xufVxuXG4vL0NyZWF0ZXMgYSBidXR0b24gdGhhdCBhbGxvd3MgdXNlcnMgdG8gb3B0IGluIG9yIG91dCBvZiB0ZWFtc1xuZnVuY3Rpb24gaW5pdFRlYW1CdXR0b24oc3RhZ2UsIHBsYXllcil7XG5cbiAgIC8vUHV0IGJ1dHRvbiBhdCByaWdodCBvZiBqb3lzdGlja1xuICAgdmFyIGJ1dHRvblBvcyA9IHt4OiBzdGFnZS5jYW52YXMud2lkdGggLSBzdGFnZS5jYW52YXMud2lkdGgvNiwgeTogc3RhZ2UuY2FudmFzLmhlaWdodC8yfTtcbiAgIHZhciB0ZWFtQnV0dG9uID0gbmV3IFRlYW1CdXR0b24oYnV0dG9uUG9zLCBcImdyZXlcIiwgcGxheWVyKTtcbiAgIHRlYW1CdXR0b24uYWRkKHN0YWdlKTtcblxuICAgcmV0dXJuIHRlYW1CdXR0b247XG59XG5cbi8vSW5pdGlhbGl6ZSBBKiBwYXRoZmluZGluZyB3aXRoIGVhc3lzdGFyIGxpYmFyeVxuZnVuY3Rpb24gaW5pdFBhdGhmaW5kaW5nKHdvcmxkLCBwbGF5ZXIsIGJhY2tncm91bmQpe1xuXG4gICB2YXIgZWFzeXN0YXIgPSBuZXcgRWFzeVN0YXIuanMoKTtcbiAgIGVhc3lzdGFyLnNldEdyaWQod29ybGQpO1xuICAgZWFzeXN0YXIuc2V0QWNjZXB0YWJsZVRpbGVzKFswXSk7IC8vdGlsZXMgd2UncmUgYWJsZSB0byB3YWxrIG9uXG4gICBlYXN5c3Rhci5lbmFibGVEaWFnb25hbHMoKTsgXG4gICBcbiAgIC8vR2VuZXJhdGUgcGF0aCB3aGVuIGJhY2tncm91bmQgaXMgY2xpY2tlZFxuICAgYmFja2dyb3VuZC5nZXRFYXNlbFNoYXBlKCkub24oXCJjbGlja1wiLCBmdW5jdGlvbihlKXtcbiAgICAgICAgIHZhciBwb3MgPSBwbGF5ZXIuZ2V0UG9zKCk7XG4gICAgICAgICBcbiAgICAgICAgIGVhc3lzdGFyLmZpbmRQYXRoKE1hdGguZmxvb3IocG9zLngpLCBNYXRoLmZsb29yKHBvcy55KSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmZsb29yKGUuc3RhZ2VYKSwgTWF0aC5mbG9vcihlLnN0YWdlWSksIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24ocGF0aCl7IFxuICAgICAgICAgICAgICBpZiggcGF0aCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQYXRoIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgcGxheWVyLnBhdGggPSBwYXRoO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICB9KTtcbiAgIH0pO1xuICAgcmV0dXJuIGVhc3lzdGFyO1xufVxuXG5mdW5jdGlvbiBzZXRFdmVudEhhbmRsZXJzKCkge1xuICAgc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBvblNvY2tldENvbm5lY3RlZCk7XG4gICBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIG9uU29ja2V0RGlzY29ubmVjdCk7XG4gICBzb2NrZXQub24oXCJuZXcgcGxheWVyXCIsIG9uTmV3UGxheWVyKTtcbiAgIHNvY2tldC5vbihcIm1vdmUgcGxheWVyXCIsIG9uTW92ZVBsYXllcik7XG4gICBzb2NrZXQub24oXCJyZW1vdmUgcGxheWVyXCIsIG9uUmVtb3ZlUGxheWVyKTtcbn07XG5cbmZ1bmN0aW9uIG9uU29ja2V0Q29ubmVjdGVkKCkge1xuICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogQ2xpZW50IGNvbm5lY3RlZCBvbiBwb3J0IDogXCIrZ2FtZXBvcnQpOyBcbiAgIHNvY2tldC5lbWl0KFwibmV3IHBsYXllclwiLCB7ICAgIHg6IHN0YWdlLmNhbnZhcy53aWR0aC8yLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBzdGFnZS5jYW52YXMuaGVpZ2h0LzIgfSk7XG59XG5cbmZ1bmN0aW9uIG9uU29ja2V0RGlzY29ubmVjdCgpIHtcbiAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IENsaWVudCBkaXNjb25uZWN0ZWQgZnJvbSBwb3J0IDogXCIrZ2FtZXBvcnQpOyAvL0dsb2JhbFxuICAgLy9DbGVhciBhbGwgcmVtb3RlIHBsYXllcnMvZ2FtZSBvYmplY3RzXG5cbiAgIC8vQ2xlYXIgcmVtb3RlIFBsYXllcnNcbiAgIGZvciggaSA9IDA7IGkgPCByZW1vdGVQbGF5ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgIGN1cnJlbnQgPSByZW1vdGVQbGF5ZXJzW2ldO1xuICAgICAgICAgY3VycmVudC5yZW1vdmUoc3RhZ2UpO1xuICAgfVxuICAgcmVtb3RlUGxheWVycyA9IFtdO1xuXG59XG5cbmZ1bmN0aW9uIG9uTmV3UGxheWVyKGRhdGEpIHtcbiAgIGNvbnNvbGUubG9nKFwiQ2xpZW50IDo6IE5ldyBwbGF5ZXIgXCIrZGF0YS5pZCtcImNvbm5lY3RlZCBvbiBwb3J0IDogXCIrZ2FtZXBvcnQpO1xuXG4gICBcbiAgIHZhciBuZXdQbGF5ZXIgPSBuZXcgUGxheWVyKHt4OiBkYXRhLngsIHk6IGRhdGEueX0pOyAvL1RPRE8gcmV3cml0ZSBwbGF5ZXIgXG5cbiAgIG5ld1BsYXllci5pZCA9IGRhdGEuaWQ7XG4gICBuZXdQbGF5ZXIuYWRkKHN0YWdlKTsgLy9zdGFnZSA9IGN1cnJlbnQgc3RhZ2UgZ2xvYmFsXG4gICByZW1vdGVQbGF5ZXJzLnB1c2gobmV3UGxheWVyKTtcblxufVxuXG5mdW5jdGlvbiBvbk1vdmVQbGF5ZXIoZGF0YSkge1xuICAgdmFyIG1vdmVQbGF5ZXIgPSBwbGF5ZXJCeUlkKGRhdGEuaWQpO1xuXG4gICBpZighbW92ZVBsYXllcikge1xuICAgICAgY29uc29sZS5sb2coXCJDbGllbnQgOjogUGxheWVyIG5vdCBmb3VuZDogXCIgKyBkYXRhLmlkKTtcbiAgICAgIHJldHVybjtcbiAgIH1cblxuICAgbW92ZVBsYXllci5zZXRQb3Moe3g6IGRhdGEueCwgeTogZGF0YS55fSk7XG59XG5cbmZ1bmN0aW9uIG9uUmVtb3ZlUGxheWVyKGRhdGEpIHtcbiAgIHZhciByZW1vdmVQbGF5ZXIgPSBwbGF5ZXJCeUlkKGRhdGEuaWQpO1xuXG4gICBpZighcmVtb3ZlUGxheWVyKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkNsaWVudCA6OiBQbGF5ZXIgbm90IGZvdW5kOiBcIitkYXRhLmlkKTtcbiAgICAgIHJldHVybjtcbiAgIH07XG5cbiAgIC8vUmVtb3ZlIHRoZSBwbGF5ZXIgZnJvbSByZW1vdGVwbGF5ZXJzIGFycmF5XG4gICByZW1vdmVQbGF5ZXIucmVtb3ZlKHN0YWdlKTsgLy9HbG9iYWwgc3RhZ2VcbiAgIHJlbW90ZVBsYXllcnMuc3BsaWNlKHJlbW90ZVBsYXllcnMuaW5kZXhPZihyZW1vdmVQbGF5ZXIpLDEpO1xufVxuXG4vLyBNdWx0aXBsYXllciBIZWxwZXIgRnVuY3Rpb25zIFxuZnVuY3Rpb24gcGxheWVyQnlJZChpZCl7XG4gICB2YXIgaSA7XG4gICBmb3IoIGkgPSAwOyBpIDwgcmVtb3RlUGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYocmVtb3RlUGxheWVyc1tpXS5pZCA9PSBpZClcbiAgICAgICAgICAgIHJldHVybiByZW1vdGVQbGF5ZXJzW2ldO1xuICAgfTtcblxuICAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbiJdfQ==
