var canv;
var width, height;
var ctx, tileSize, tilesX, tilesY;
var firstColor, lastColor, firstLineColor, lastLineColor;

var stop = false;
var frameCount = 0;
var fps, fpsInterval, startTime, now, then, elapsed;
fps = 10;
var stopAnimating;

var toggle = document.createElement("p");
toggle.style.opacity = "0.15";
toggle.style.cursor = "pointer";
toggle.style.position = "fixed";
toggle.style.margin = "0px";

$(function(){
	if(localStorage.getItem("animation") != "false"){
		console.log("going to animate");
		init();
	}else{
		toggle.innerText = "Turn animation on";
		toggle.onclick = init;
		console.log("not going to animate");
	}
	toggle.style.top = window.innerHeight - 25 + "px";
	document.body.append(toggle);
})

function init(){
	localStorage.setItem("animation", true);
	toggle.innerText = "Turn animation off";
	toggle.onclick = stopAnimating;
	
	canv = document.createElement("canvas");
	document.body.appendChild(canv);
	
	width = window.innerWidth;
	height = window.innerHeight;
	canv.width = width;
	canv.height = height;
	
	ctx = canv.getContext("2d");


	tileSize = 25;
	tilesX = Math.floor(width / tileSize) + 1;
	tilesY = Math.floor(height / tileSize) + 1;

	firstColor = [30,30,35];
	lastColor = firstColor;//[60,60,70];
	firstLineColor = firstColor;//[15,15,15];
	lastLineColor = [0,0,0];
	
	notAnimating = false;
	
	startAnimating(fps);
}


function stopAnimating(){
	notAnimating = true;
	localStorage.setItem("animation", false);
	toggle.innerText = "Turn animation on";
	toggle.onclick = init;
	
	try{
		document.body.removeChild(canv);
	}catch(l){}
	
}

// initialize the timer variables and start the animation

function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}

function animate() {

    // request another frame

    requestAnimationFrame(animate);

    // calc elapsed time since last loop

    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame

    if (elapsed > fpsInterval && notAnimating == false) {

        // Get ready for next frame by setting then=now, but also adjust for your
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        then = now - (elapsed % fpsInterval);

        // Put your drawing code here
		var time = Date.now();
		
		for(var i = 0; i < tilesX; i++){
			for(var j = 0; j < tilesY; j++){
				
				var color = lerpColor(firstColor, lastColor, 
					Math.pow(Math.sin((time+((tilesX-i)*j-j))/500),8)
				);
				var lineColor = lerpColor(firstLineColor, lastLineColor, 
					Math.pow(Math.sin((time+((tilesX-i)*j-j))/500),8)
				);
				drawTile(i,j,color,lineColor);
			}
		}
    }
}

function lerpColor(c1, c2, i){
	var r = Math.floor(lerp(c1[0], c2[0], i));
	var g = Math.floor(lerp(c1[1], c2[1], i));
	var b = Math.floor(lerp(c1[2], c2[2], i));
	return("rgb("+r+","+g+","+b+")")
}

function lerp(a, b, i){
	//return (a * (1.0 - i)) + (b * i);
	return a + i * (b - a);
}

function drawTile(x, y, color, lineColor){

	ctx.fillStyle = color;
	ctx.strokeStyle = lineColor;
	ctx.lineWidth = 2;
	ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
	ctx.strokeRect(x*tileSize, y*tileSize, tileSize, tileSize)
}
