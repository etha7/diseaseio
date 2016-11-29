var canvas = document.getElementById("mainCanvas");
var homebutton = document.getElementById("home-button");
var canvasLeft = canvas.offsetLeft,
    canvasTop = canvas.offsetTop;
var context = canvas.getContext("2d");
var clickableElements = [];
var socket;
var safeClicked = true;
var safeCount = 0;
var riskCount = 0;
var jsonSource = "public/json/mapGraph.json";

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight; 

mapMain();

function mapMain(){
       //Initialize the game world
   var stage        = new createjs.Stage("mainCanvas")
   
     //Enable touch based interface for mobile devices
   createjs.Touch.enable(stage);

   socket = io.connect();


    //Read data form mapGraph.json, then write back
    var selectionButton = document.getElementById("game-start-button");
       selectionButton.addEventListener('click', function(event) {
       //var fs = require('fs');
       if(safeClicked) {
          //Read from json source
          $.get('data', function(data) {   
             var json = data;
             console.log(data);
             
             //Row, column
             safeCount = parseInt(json["rows"]["0"]["c"]["1"]["v"]);
             console.log(safeCount);
             safeCount++;
             json["rows"]["0"]["c"]["1"]["v"] = safeCount.toString();
             console.log(JSON.stringify(json));
            
             console.log("Safe count is " + safeCount);
             //Write back to file
             socket.emit("write", { filename: jsonSource, 
                content:  JSON.stringify(json)
             }); 
             console.log("Writing to "+jsonSource+" from client");
             }); 
                                                                                                                                                                                                                                                                                           }   
       else {
          //Read from json source
          $.get('data', function(data) {
             console.log(data);
             var json = data;
             //Row, column
             riskCount = parseInt(json["rows"]["1"]["c"]["1"]["v"]);
             riskCount++;
             json["rows"]["1"]["c"]["1"]["v"] = riskCount.toString();
             console.log("Risk count is " + riskCount);
             //Write back to file
             socket.emit("write", { filename: jsonSource,
             content:  JSON.stringify(json)
             });
             console.log("Writing to "+jsonSource+"from client");
          });
       }
});

   //Resize canvas on window resize   
   window.addEventListener('click', function(event) {
    var x = event.pageX - canvasLeft,
        y = event.pageY - canvasTop;
     //Collision detection between clicked offset and element.
    clickableElements.forEach(function(element) {
        if (y > element.top && y < element.top + element.height 
            && x > element.left && x < element.left + element.width) {
            //alert('clicked an element');
            //element.clicked(stage);
        }
    });
}, false)


   //Resize canvas on window resize   
   window.addEventListener("resize", function(){
      stage.canvas.width  = window.innerWidth;
      stage.canvas.height = window.innerHeight;
   }, false);
   
   //Main game loop
   var FPS = 50;
   createjs.Ticker.setFPS(FPS);
   createjs.Ticker.addEventListener("tick", function(){
      //Commit all updates to actual stage/canvas
      stage.update();

   });
   
   var world        = initWorld();
   var background   = initBackground(stage, canvas);
   
   //function initText(stage, canvas, text, color, xpos, ypos){
   
   //var helpText1 = initText(stage, canvas, "The location you have selected is represented", "white", canvas.width/3, canvas.height/10);
  // var helpText2 = initText(stage, canvas, "as a white dot, click elsewhere to move selected position", "white", canvas.width/3, canvas.height/8);
   var citySelectionText = initCitySelectionText(stage,canvas);
   citySelectionText.color = "green";
   var safeCity = new City({x: canvas.width/6, y: canvas.height/2}, "green", stage, "Safe", citySelectionText);
   safeCity.add();
   clickableElements.push(safeCity);
   var riskCity = new City({x: (5 * canvas.width)/6, y: canvas.height/2}, "red", stage, "Risky", citySelectionText);
   riskCity.add();
   clickableElements.push(riskCity);
   
}


function main(){
   //Initialize the game world
   var stage        = new createjs.Stage("mainCanvas");
   var world        = initWorld();
   var background   = initBackground(stage, canvas);
   
   //Initalize the game controls and player
   var left         = initJoysticks(stage).left;
   var player       = initPlayer(stage, left);
       player.setCamera(new Camera(player.getPos(), canvas.width, canvas.height));

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
   }, false);
   

   //Main game loop
   var FPS = 50;
   createjs.Ticker.setFPS(FPS);
   createjs.Ticker.addEventListener("tick", function(){

      //Do pathfinding calculation
      easystar.calculate();

      //Move player according to joystick
      player.move();

      //Check if player is colliding with resources
      player.pickup(stage, resources);

      //Move along calculated pathfinding path
      player.goPath();

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


//Class definitions:------------------------------------------------

//Base class for all primitive objects that get drawn
function easelObject(pos, color){

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
function Rectangle(pos, color, width, height){
   easelObject.call(this, pos, color);
   
   this.width  = width;
   this.height = height;
   this.top = pos.y;
   this.left = pos.x;
   
   //Draw the rectangle
   this.draw = function(){
      this.shape.graphics.beginFill(this.color).drawRect(this.left,this.top,this.width, this.height);
   }
   this.draw();

}

//A class for representing circles
function Circle(pos, color, radius ){
   //Call constructor of superclass
   easelObject.call(this, pos, color);  

   //Set the new radius
   this.radius = radius;

   //All of these elements are currently being used to check whether something has been clicked on or not.
   this.top = pos.y - radius;
   this.left = pos.x - radius;
   this.height = 2*radius;
   this.width = 2*radius;
   
   //Determines if circle is dotted outline
   this.isDotted = false;
   this.invertIsDotted = function(){ this.isDotted = !this.isDotted;}

   //Function: draw a circle
   this.draw = function(){
      this.easelShape.graphics.beginFill(this.color).drawCircle(0,0,this.radius);
   }
   //Function: draw a dotted circle
   this.drawDotted = function(){
      this.easelShape.graphics.setStrokeDash([2,2]);
      this.easelShape.setStrokeStyle(2).beginsStroke("grey").drawCircle(0,0,this.radius);
   }
    
   //Actually draw the circle
   if(this.isDotted === true)
      this.drawDotted();
   else
      this.draw();
}

function Resource(value){
   Circle.call(this, {x: 0, y: 0}, "blue", 10);
   Circle.call(this, playerPos, "grey", 30);
   this.value = value;
}

function DiseaseZone(playerPos){
   this.invertIsDotted();
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





function Player(joystick){
   Circle.call( this, {x: canvas.width/2, y: canvas.height/2}, "red", 20);

   this.diseaseZone = new DiseaseZone(this.getPos());
   this.joystick = joystick;
   this.resources = 0;
   this.camera = {};
   this.path = [];

   this.getCamera = function(){ return this.camera;};
   this.setCamera = function(camera){ this.camera = camera; };
   
   //Moves the player along a path determined by A* algorithm
   this.goPath = function(){
      
      if(this.path.equals([]) === false)
      {
         this.setPos({x: this.path[0].x, y: this.path[0].y});
         this.path.splice(0,1); //Remove element 0;
      }
   }

   this.getResources = function(){ return this.resources;};
   this.setResources = function(newResources){ this.resources = newResources};

   //Override inherited setPos
   var parentSetPos = this.setPos;
   this.setPos = function(pos){ 
       this.camera.setPos(pos);
       parentSetPos.call(this, pos); //need call so 'this' is defined as the current Player
   };
      
   
   //Update player's location with respect to joystick
   this.move = function () {

      //Move player with left joystick
      var playerPos = this.getPos();
      var direction = this.joystick.getDirection();
      if(isNaN(direction.x) || isNaN(direction.y))
      {
         direction.x = 0;
         direction.y = 0;
      }
      playerPos.x += this.joystick.getForce()*direction.x;
      playerPos.y += this.joystick.getForce()*direction.y;
      this.setPos(playerPos);
   };

   //Check if standing on any resources
   this.pickup = function(stage, resources){
      var easelShape = this.getEaselShape();
      var resourceCopy = resources.slice(0,resources.length);
      for (var x of resourceCopy){
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


//Creates a Joystick at the given location
function Joystick(pos){

   this.pos = pos;

   this.baseSize = 35;
   this.baseColor = "red";
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
   
   this.getPos = function() { return this.stick.getPos()};

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

   this.add = function(stage){
      stage.addChild(this.base.getEaselShape());
      stage.addChild(this.stick.getEaselShape());
      stage.update();
   }

}


//Creates a City at the given location
function City(pos, baseColor, stage, type, citySelectionText){
   this.pos = pos;
   
   this.stage = stage;
   
   this.cityType = type;
   this.citySelectionText = citySelectionText;
   
   this.baseSize = 35;
   this.baseColor = baseColor;
   this.base = new Circle(this.pos, this.baseColor, this.baseSize);

   if(type === "Safe") {
      this.stickSize = 25;
      this.stickColor = "white"; 
      this.stick =  new Circle(this.pos, this.stickColor, this.stickSize);

   } else { 
      this.stickSize = 25;
      this.stickColor = baseColor;
      this.stick =  new Circle(this.pos, this.stickColor, this.stickSize);
   }
   

   this.top = pos.y;
   this.left = pos.x;
   this.height = this.baseSize;
   this.width = this.baseSize;

   this.base.getEaselShape().on("click", function(e){
        clickableElements.forEach(function(element) {
          element.unselected(stage);
        });

        if(this.cityType == "Safe") {
           safeClicked = true;
        }
        else {
           safeClicked = false;
        }
        var stickSize = 25;

        var stickColor = "white"; //
        var stick =  new Circle(pos, stickColor, stickSize);
        citySelectionText.text = "City Selection: " + type;
        citySelectionText.color = baseColor;
        stage.addChild(stick.getEaselShape());
        stage.update();
   });
   
   this.unselected = function(stage){
        this.stickSize = 26;
        this.stickColor = baseColor;
        this.stick =  new Circle(this.pos, this.stickColor, this.stickSize);
        stage.addChild(this.stick.getEaselShape());
        stage.update();
   }
   
   this.getPos = function() { return this.stick.getPos()};

   this.getCityType = function() {return this.cityType};
   this.getCitySelectionText = function() {return this.citySelectionText};

   this.add = function(){
      this.stage.addChild(this.base.getEaselShape());
      this.stage.addChild(this.stick.getEaselShape());
      this.stage.update();
   }
}


//Class definitions:^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

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

function initText(stage, canvas, text, color, xpos, ypos){
   var newText = new createjs.Text(text, "20px Arial", color);
   newText.x = xpos;
   newText.y = ypos; //TODO more logically position Resources text
   newText.textBaseline = "alphabet"; //Not sure what this setting does
   stage.addChild(newText);
   return newText;
}

function initHelpText(stage, canvas){
   resourceText = new createjs.Text("The city you have selected is represented as a blue dot", "20px Arial", "blue");
   resourceText.x = 0;
   resourceText.y = canvas.height/6; //TODO more logically position Resources text
   resourceText.textBaseline = "alphabet"; //Not sure what this setting does
   stage.addChild(resourceText);
   return resourceText;
}

//Creates and displayes the Resources: x text
function initResourceText(stage, canvas){
   resourceText = new createjs.Text("Resources: 0", "20px Arial", "#00FFFF");
   resourceText.x = 0;
   resourceText.y = canvas.height/12; //TODO more logically position Resources text
   resourceText.textBaseline = "alphabet"; //Not sure what this setting does
   stage.addChild(resourceText);
   return resourceText;
}

//Creates and displayes the City Selection: x text
function initCitySelectionText(stage, canvas){
   resourceText = new createjs.Text("City Selection: Safe", "20px Arial", "#00FFFF");
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

   //TODO convert the background to a working Rectangle
   //var background = new Rectangle({x: canvas.width/2, y: canvas.height/2}, color, width, height);
   var background = new Circle( {x: width/2, y: width/2}, color, 2000);
   background.add(stage);

   return background;

}

//Create desired Joysticks for the user
function initJoysticks(stage){
   var canvas = document.getElementById("mainCanvas");
   //var right  = new Joystick({x:canvas.width - canvas.width/6, y: canvas.height/2});
   var left = new Joystick({x: canvas.width/6, y: canvas.height/2});

   //Add to canvas
   //right.add(stage);
   left.add(stage);

   return {left: left};
}

//Create desired Cities for the user
function initCity(stage){
   var canvas = document.getElementById("mainCanvas");
   //var right  = new Joystick({x:canvas.width - canvas.width/6, y: canvas.height/2});
   var left = new City({x: canvas.width/6, y: canvas.height/2});

   //Add to canvas
   //right.add(stage);
   left.add(stage);

   return {left: left};
}

//Creates a player and associates it to a joystick
function initPlayer(stage, stick){
   player = new Player(stick);
   player.add(stage);
   return player;
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

                  //By default, easystar produces paths of very high resolution
                  //The code which updates the player's position in order to follow this path
                  //can only move one position per tick. In order to speed up the player
                  //either ticks must go faster, or the path has to have less elements without looking
                  //choppy. The code below attempts the latter.

                  //Remove every fourth element of the path 
                  for(var i = 0; i < path.length; i++)
                  {
                     if((i%2) === 0)
                     {
                        path.splice(i,2); //remove i from path
                        i++;
                     }
                  }
                  player.path = path;
              }
         });
   });
   return easystar;
}
