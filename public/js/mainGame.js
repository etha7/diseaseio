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
   console.log("socket:");
   console.log(socket);
   //TODO change from localhost
   
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

      var newPathPos;
      player.goPath(deltaTime);
      socket.emit("move player", {  x: player.getPos().x,
                                    y: player.getPos().y});
              
      for(i = 0; i < remotePlayers.length; i++) {
         currPlayer = remotePlayers[i];
         newPathPos = currPlayer.goPath(deltaTime);
         socket.emit("move player", {  x: newPathPos.x,
                                       y: newPathPos.y });
      }


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


//Creates a square world of size 1000 that our pathfinding algorithm can use
function initWorld(){
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

   console.log("emmitting LOCATION");
   console.log(stage.canvas.width/2);

   socket.emit("new player", {   id: player.id, 
                                  x: stage.canvas.width/2, 
                                  y: stage.canvas.height/2 });
}

function onSocketDisconnect() {
   console.log("Client :: Client disconnected from port : "+gameport);
}

function onNewPlayer(data) {
   console.log("Client :: New player "+data.id+"connected on port : "+gameport);

   
   var newPlayer = new Player({x: data.x, y: data.y}); //TODO rewrite player 

   console.log("NEW PLAYER LOCATION");
   console.log(newPlayer.getPos());
   newPlayer.id = data.id;
   remotePlayers.push(newPlayer);

   //stage = current stage global
   newPlayer.add(stage);
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


