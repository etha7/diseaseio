var video = document.createElement('video');
video.src = 'videos/gameTutorial.mp4';
video.autoplay = true;
video.loop = true;
video.style.width = "100%";
video.play();



var canvas = document.getElementById('mainCanvas');
canvas.style.display = "none"; //Hide Canvas

var tutorialDiv = document.getElementById('tutorial');
tutorialDiv.style.width = "100%";
tutorialDiv.style.border = "thick solid white";

var title = document.createElement('div');
title.innerHTML = "How to play:";
title.color = "white";

var description = document.createElement('div');
description.innerHTML = "Use the joystick on the left to move!";
description.color = "white";

var click = document.createElement('div');
click.innerHTML = "Click/Tap the video to continue!";
click.color = "white";

tutorialDiv.appendChild(title);
tutorialDiv.appendChild(description);
tutorialDiv.appendChild(video);
tutorialDiv.appendChild(click);

tutorialDiv.onclick = function() {
   tutorialDiv.style.display = "none";
   canvas.style.removeProperty('display'); //Show canvas
   console.log("Exited Tutorial Video");
}


console.log("made video");
