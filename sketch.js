/*PalmTree animation using P5JS!
 * Sean McNeely 2020
 * Tree dances to music and can be reshaped
 */ 

var canvas;
var p; //will hold palm tree

totalSongs = 2;
songsLoaded = 0;

//variables determine shape of tree
rootX = 250;
rootY = 460;
leafChunks = 8;
trunkChunks = 8;
trunkBuffer = 5;
treeHeight = 300;
trunkChunkHeight = (treeHeight - trunkChunks*trunkBuffer)/trunkChunks;
treeMaxWidth = 50;
treeMinWidth = 20;
referenceY = 1500;
swayWidth = 100;

//starting angle and stepsize of tree sway
theta = 0.0;
thetaStep = 0.05;

//number of points sampled on trunk bezier curve, more points -> smoother movement
curveGranularity = 300;

//changes size of canvas, tree, and input when window is resized
function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
	rootX = windowWidth/2;
	rootY = windowHeight*4/5;
	sway.position(rootX + windowWidth/5, rootY - 300);
	tc.position(rootX + windowWidth/5, rootY - 300 + 60);
	lc.position(rootX + windowWidth/5, rootY - 300 + 120);
	minW.position(rootX + windowWidth/5, rootY - 300 + 180);
	maxW.position(rootX + windowWidth/5, rootY - 300 + 240);
	sp.position(rootX + windowWidth/5, rootY - 300 + 300);
	treeHeight = windowHeight/2;
	trunkChunkHeight = (treeHeight - trunkChunks*trunkBuffer)/trunkChunks;
	p = new PalmTree();
	
	if(typeof tameImpala !== 'undefined' && typeof oklou !== 'undefined'){
		tameImpala.position(rootX - windowWidth/10, rootY + trunkChunkHeight);
		oklou.position(rootX + windowWidth/60, rootY + trunkChunkHeight);
	}
}

function setup(){
	//tame = loadSound("cook.mp3", loaded);
    //ok = loadSound("oklou.mp3", loaded);
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.position(0,0);
	canvas.style('z-index', '-1');
	rootX = windowWidth/2;
	rootY = windowHeight*3/4;
	
	sway = createSlider(0, 250, 100);
	sway.changed(function() {slider(0);});
	
	tc = createSlider(1, 40, 8);
	tc.changed(function() {slider(1);});
	
	lc = createSlider(0, 35, 8);
	lc.changed(function() {slider(2);});
	
	minW = createSlider(1, windowWidth/2, 20);
	minW.changed(function() {slider(3);});
	
	maxW = createSlider(1, windowWidth/2, 50);
	maxW.changed(function() {slider(4);});
	
	sp = createSlider(1, 60, 5);
	sp.changed(function() {slider(5);});
	
	stroke(255);
	
	windowResized();
}

//called when tree slider value is changed by user, sometimes must create new palmTree
function slider(changeType){
	if(changeType == 0){
		swayWidth = sway.value();
		return;
	}
	
	if(changeType == 5){
		thetaStep = sp.value()/100;
		return;
	}
	
	trunkChunks = tc.value();
	leafChunks = lc.value();
	treeMinWidth = minW.value();
	treeMaxWidth = maxW.value();
	trunkChunkHeight = (treeHeight - trunkChunks*trunkBuffer)/trunkChunks;
	p = new PalmTree();
}

//called when "play a song" buttons are pressed, plays song
/*function playSong(songID){
	if(songID == 0){
		if (tame.isPlaying()) {
		    tame.stop();
		    document.getElementById("tameImpala").innerHTML = "Play a Fast Song";
		  } else {
			if(ok.isPlaying()){
			   ok.stop();
			}
			document.getElementById("oklou").innerHTML = "Play a Slow Song";
		    tame.play();
		    thetaStep = (14.76/frameRate())/2;
		    document.getElementById("tameImpala").innerHTML = "Stop...";
		  }
	}
	if(songID == 1){
		if (ok.isPlaying()) {
		    ok.stop();
		    document.getElementById("oklou").innerHTML = "Play a Slow Song";
		  } else {
			if(tame.isPlaying()){
			   tame.stop();
			}
			document.getElementById("tameImpala").innerHTML = "Play a Fast Song";
		    ok.play();
		    thetaStep = (9.948/frameRate())/4;
		    document.getElementById("oklou").innerHTML = "Stop...";
		  }
	}
}*/

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

//callback for when a song asset is loaded, once all songs loaded, displays play buttons
/*function loaded(){
	++songsLoaded;
	if(songsLoaded < totalSongs){
		return;
	}
	tameImpala = createButton("Play a Fast Song");
	tameImpala.id('tameImpala')
	tameImpala.mousePressed(function() { playSong(0);});
	tameImpala.position(rootX - windowWidth/10, rootY + treeHeight / 10);
	
	oklou = createButton("Play a Slow Song");
	oklou.id('oklou')
	oklou.mousePressed(function() { playSong(1);});
	oklou.position(rootX + windowWidth/60, rootY + treeHeight / 10);
}*/

class PalmTree{
  constructor(){
    fill(222,184,135);
    this.curveX = new Array();
    this.curveY = new Array();
    this.trunkChunks = new Array();
    this.leafChunks = new Array();
    
    for(let i = 0; i < trunkChunks; i++){
      var baseY = rootY - i*(trunkBuffer+trunkChunkHeight);
      var baseX = rootX;
      var topY = baseY - trunkChunkHeight;
      var topX = rootX;
      this.trunkChunks[i] = new TrunkPiece(baseX, baseY, topX, topY);
    }
    
    for(let i = 0; i < leafChunks; i++){
      this.leafChunks[i] = new LeafPiece(topX, topY);
    }
  }
  
  //finds closest point on bezier curve to next point on tree, given current y value, "height" of next segment, and estimated slope
  findClosestPoint(y, slope, height){
    var calcHeight = sqrt((height)**2)/(1 + (1/slope**2));
    var newY = y - calcHeight;

    var best = 0;
    for(let i = 0; i < curveGranularity; i++){
      if(Math.abs(this.curveY[i] - newY) < Math.abs(this.curveY[best] - newY)){
         best = i;
      }
    }
    return best;
  }
  
  //advances palmTree forward one step and redraws tree
  swayStep(){
    theta += thetaStep;
    let sway = swayWidth*sin(theta);
    let swayX = rootX + swayWidth*sin(theta);
    let swayY = rootY - sqrt(treeHeight**2 - sway**2);
    
    for(let i = 0; i < curveGranularity; i++){
      let t = i/curveGranularity;
      this.curveX[i] = curvePoint(rootX, rootX, swayX, swayX, t);
      this.curveY[i] = curvePoint(referenceY, rootY, swayY, swayY, t);
    }
    
    var baseY = rootY;
    var baseX = rootX;
    var topY = rootY - trunkChunkHeight;
    var topX = rootX;
    var slopeBottom = 0.0;
    var slopeTop = 0.0;
    let index = 0;
    for(let i = 0; i < trunkChunks; i++){
      if(i != 0){
        slopeBottom = (this.curveY[index + 1] - this.curveY[index])/(this.curveX[index + 1] - this.curveX[index]);
        index = this.findClosestPoint(topY, slopeBottom, trunkBuffer);
      }
      baseY = this.curveY[index];
      baseX = this.curveX[index];
      
      slopeTop = (this.curveY[index + 1] - this.curveY[index])/(this.curveX[index + 1] - this.curveX[index]);
      index = this.findClosestPoint(baseY, slopeTop, trunkChunkHeight);
      topY = this.curveY[index];
      topX = this.curveX[index];
      this.trunkChunks[i].draw(slopeBottom, slopeTop, baseX, baseY, topX, topY);
    }
    
    for(let i = 0; i < leafChunks; i++){
      this.leafChunks[i].draw(topX, topY);
    }
  }
}

class LeafPiece{
  constructor(topX, topY){
    var direction = Math.random() < 0.5 ? -1 : 1;
    var offsetX = getRndInteger(treeHeight/2, treeHeight*2/3);
    this.offsetX = offsetX * direction;
    this.offsetY = getRndInteger(-treeHeight/5, treeHeight/5);
    fill(34,139,34);
    curve(rootX + this.offsetX, rootY, topX, topY, topX + this.offsetX, topY + this.offsetY, topX + this.offsetX, topY + this.offsetY);
  }
  
  draw(topX, topY){
    fill(34,139,34);
    curve(rootX + this.offsetX, rootY, topX, topY, topX + this.offsetX, topY + this.offsetY, topX + this.offsetX, topY + this.offsetY);
  }
}

class TrunkPiece{
  constructor(bottomX, bottomY, topX, topY){
    this.bottomLeft = getRndInteger(treeMaxWidth, treeMinWidth);
    this.bottomRight = getRndInteger(treeMaxWidth, treeMinWidth);
    this.topLeft = getRndInteger(treeMaxWidth, treeMinWidth);
    this.topRight = getRndInteger(treeMaxWidth, treeMinWidth);
    fill(222,184,135);
    quad(topX - this.topLeft, topY, topX + this.topRight, topY, bottomX + this.bottomRight, bottomY, bottomX - this.bottomLeft, bottomY);
  }
  
  draw(slopeBottom, slopeTop, baseX, baseY, topX, topY){
    fill(222,184,135);
    quad(topX - this.topLeft, topY, topX + this.topRight, topY, baseX + this.bottomRight, baseY, baseX - this.bottomLeft, baseY);
  }
}

//main loop of animation
function draw() {
  background(19,6,114)
  p.swayStep(); 
}
