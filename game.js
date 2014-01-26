var Q = Quintus().include("Sprites,UI,Input,Touch,Anim,Scenes,2D,Audio")
             .setup({ maximize : true })
             .controls()
             .touch()
			 .enableSound();
var timerTotalTime;              
var CURRENTLEVEL = 0;
var GATENAME = ['Greed','Gluttony','Sloth','Pride','Lust','Envy','Wrath'];
var CHATTERS = [
	"Every slimmer of thought has the potential to succeed as the dominating thought. Yet would this be the one?",
	"Logic, reasoning, desires. Which ones will be the biggest influence?",
	"Choices, it was always tough.",
	"The pilgrimage of succession was undertake by all, but few succeed.",
	"Where are we off to today?",
	"The grass always seem to be greener on the other side.",
	"Lust with a sprinkle of caution, as all roses have thorns.",
	"Not all you see is food.",
	"The new ones grow, travel, learn, die, and is revived in fashions.",
	"Nothing is still an option."
];

Q.ENDING_LINES = "I...I am me. This is what I am.";

var UIshowTime = document.getElementById("showTime");
var UIshowLives = document.getElementById("showLives");
var UIshowStage = document.getElementById("showStage");
var UIstatusBox = document.getElementById("statusBox");

var UIpreloader = document.getElementById("preloader");


Q.BULLETDAMAGE = 20;
Q.SPRITE_BULLET = 2;		
Q.TILE_SIZE = 70;
Q.GAME_NAME = "7th Loop";
Q.STAGESARCHIVED = "Tutorial";
Q.LIFELOST = 0;
Q.TOTALTIME = 0;

var timerTotalTime;

// CONVERT MILLISECONDS TO DIGITAL CLOCK FORMAT
function convertMillisecondsToDigitalClock(ms) {
    hours = Math.floor(ms / 3600000), // 1 Hour = 36000 Milliseconds
    minuets = Math.floor((ms % 3600000) / 60000), // 1 Minutes = 60000 Milliseconds
    seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
	
	if(hours < 10)
		hours = "0" + hours;
		
	if(minuets < 10)
		minuets = "0" + minuets;

	if(seconds < 10)
		seconds = "0" + seconds;	
	
        return {
        hours : hours,
        minuets : minuets,
        seconds : seconds,
        clock : hours + ":" + minuets + ":" + seconds
    };
}

function statusShowHide(status){
	if(status == true){
		UIstatusBox.style.display = 'block';
	}else{
		UIstatusBox.style.display = 'none';
	}		
}

function updateStatus(){
	curGameTime = convertMillisecondsToDigitalClock(Q.TOTALTIME * 1000);
	UIshowTime.innerHTML = "Time Spend : " + curGameTime.hours + ":" + curGameTime.minuets + ":" + curGameTime.seconds;
	UIshowLives.innerHTML = Q.LIFELOST + ' life lost!';
	UIshowStage.innerHTML = 'At Stage ' + Q.STAGESARCHIVED;
}

Q.Sprite.extend("FloatingPlatform", {
	init: function(p) {
		this._super(p, { sheet: "tiles", frame:56 });
	},
	step: function(p) {
		this.p.y += this.p.ydirection * this.p.yspeed;
		if (this.p.y >= this.p.y2) 
		{
			this.p.y = this.p.y2; this.p.ydirection = -1; // reached bottom now go up
		}
		if (this.p.y <= this.p.y1) 
		{
			this.p.y = this.p.y1; this.p.ydirection = 1; // reached top now go down
		}

		this.p.x += this.p.xdirection * this.p.xspeed;
		if (this.p.x >= this.p.x2) 
		{
			this.p.x = this.p.x2; this.p.xdirection = -1; // reached bottom now go up
		}
		if (this.p.x <= this.p.x1) 
		{
			this.p.x = this.p.x1; this.p.xdirection = 1; // reached top now go down
		}
	}
});	// Why is there so many?

Q.animations("boss", { "normal": { frames:[0,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], rate:1/4 }});

Q.Sprite.extend("Boss", {
	init: function(p) {
		this._super(p, {
						sheet: "boss", 
						sprite: "boss",
						gravity: 0,
						collision: 0,
						sensor:true
						}
					); 		
 		this.add("animation, tween");

 		this.on("sensor");
	},

	step: function(dt){
		this.play("normal");
	},

	sensor: function(obj) {
	    if(obj.isA("Player")) {
        	obj.p.scale += 0.01;
        	obj.p.isCollideBoss = true;
        	
        	if (obj.p.scale > 10)
        	{
        		obj.p.speed = 0;
        	}
        	
        	if (obj.p.scale < 15)
        	{
        		Q.audio.play('startgame.ogg');
        	}
        	
        	if (obj.p.scale>25) 
        	{
        		Q.clearStage();
            	Q.stageScene("end");
        	}
        	
        }
	},

	move: function(x,y)
	{
		var obj = this;
		this.animate({ x:x, y:y }, 3, Q.Easing.Linear,  { callback:function() { obj.nextMove(); } });
		// label.animate({ opacity: 1.0}, 1, Q.Easing.Linear, {callback:function() {
		// 		label.animate({ opacity: 0}, 1, Q.Easing.Linear, {delay: timeout});
		// 	}});

	},

	nextMove: function(delay)
	{
		var rx, ry;
		rx = (this.p.x2 - this.p.x1) * Math.random() + this.p.x1;
		ry = (this.p.y2 - this.p.y1) * Math.random() + this.p.y1;
		var obj = this;
		setTimeout(function() { 
			obj.move(rx, ry) 
		}, delay==undefined?2000:delay);
	}
});

Q.animations("player", {  
			"walk": { frames: [1,2,3], rate: 1/4 },
			"stand": { frames: [0], rate: 1 },
			"jump": { frames:[6], rate: 1 },
			"ladder":  { frames:[4,5], rate: 1/2 },
			"fall":  { frames:[7,8,9,10,11], rate: 1/4 }
			});

Q.Sprite.extend("Player",{
	init: function(p) {
		this._super(p, {sheet: "player", 
						sprite: "player", 
						x: 100, y: 0, 
						jumpSpeed: -800, 
						speed: 250, 
						bulletSpeed: 50 
						}
					); 		
 		this.add("2d, platformerControls, animation");
	 	this.on("sensor.tile","checkLadder");
		this.on("jump");
    	this.on("jumped");
		
		Q.input.on("fire",this,"fire");
	},

	jump: function(obj) {
		// Only play sound once and when not on ladder and is landed.
		if (!obj.p.playedJump && !obj.p.onLadder && obj.p.landed > -0.1) {
		  Q.audio.play('jump2.ogg');
		  obj.p.playedJump = true;
		}
	},

	jumped: function(obj) {		
		obj.p.playedJump = false;
	},

	checkLadder: function(colObj) {
    	if(colObj.p.ladder) { 
    		//console.log("onLadder");
      		this.p.onLadder = true;
      		// this.p.ladderX = colObj.p.x;
    	}
  	},

	fire: function() {
		var p = this.p;
		var angle = 0;
		//p.angle;
		  
		/*if(this.facing == 1) {
			  angle = 45;
			} else {
			  angle = 315;
		}*/
		var dx =  Math.sin(angle * Math.PI / 180),
            dy = -Math.cos(angle * Math.PI / 180);
		this.c.points[0][1] -= this.c.points[0][1] * 3;  
		this.stage.insert(
            new Q.Bullet({ 
				x: this.c.points[0][0], 
                y: this.c.points[0][1],
                vx: dx * p.bulletSpeed,
                vy: dy * p.bulletSpeed
			})
		);
	},		
	
	step: function(dt) {
  		var processed = false;
  		if (this.p.isCollideBoss)
  		{
  			this.play("fall");
  			this.p.isCollideBoss = false;
  		} else if(this.p.onLadder) {
			this.p.gravity = 0;
			if(Q.inputs['up'] || Q.inputs['action']) {
				this.p.vy = -this.p.speed;
  				this.play("ladder");
				// this.p.x = this.p.ladderX;
				// this.play("climb");
			} else if(Q.inputs['down'] || Q.inputs['fire']) {
				this.p.vy = this.p.speed;
  				this.play("ladder");
				// this.p.x = this.p.ladderX;
				// this.play("climb");
			} else {
  				this.play("stand");
				this.p.vy = 0;
				//this.continueOverSensor();
			}
			processed = true;
	    }
	    else if (this.p.vy < 0 && (Q.inputs['up'] || Q.inputs['action']))
	    {
	    	this.play("jump");
	    }
	    else if (this.p.vy > 1000)
	    {
	    	this.play("fall");
	    }
	    else if (Math.abs(this.p.vx) > 0)
	    {
	    	this.play("walk");
	    }
	    else
	    {
	    	this.play("stand");
	    }
	    if (!processed) {
	    	this.p.gravity = 2;
	    }

	    this.p.onLadder = false;
		
		if(this.p.y > 4000) {
			this.destroy();
			Q.stageScene("endGame",2, { label: "Sin from thy lips? O trespass sweetly urged!" });
		}

		if (this.p.direction=="left")
			this.p.flip="";
		else
			this.p.flip="x";
  	}
});

Q.Sprite.extend("Bullet",{
        init: function(p) {

          this._super(p,{ 
            w:5,
            h:5,
            type: Q.SPRITE_BULLET
          });
          
          this.add("2d");
          this.on("hit.sprite",this,"collision");
        },

        collision: function(col) {
          var objP = col.obj.p;
          if(objP.size > 20) { 
            
          }

		if(col.obj.p.isEnemy == true){
			col.obj.p.hp-= Q.BULLETDAMAGE;
			if(col.obj.p.hp <= 0){
				col.obj.destroy();
			}
		}
          this.destroy();
        },

        draw: function(ctx) {
          ctx.fillStyle = "#f80808";
          ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
        },

        step: function(dt) {
          if(!Q.overlap(this,this.stage)) {
            this.destroy();
          }
        }
      }); 

Q.Sprite.extend("portals", {
        init: function(p) {
            this._super(p, {
                asset: "EnvyGate.png",
                scale: 0.7,
                flip: "x",
                nextStage: "",
                sensor: true
            });
             
             this.on("sensor");
            //this.add('2d');
             
            // this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
            //     if(collision.obj.isA("Player")) {
            //          Q.audio.play('startgame.ogg');
            //         Q.clearStage(1);
            //         Q.stageScene(this.p.nextStage);
            //     }
            // });
			
        },

        sensor: function(col) 
        {
        	if (Q.inputs['down'] || Q.inputs['fire'])
        	{
				Q.audio.play('startgame.ogg');
				Q.clearStage(1);
				Q.stageScene(this.p.nextStage);
        	}
        }
    });

Q.scene('endGame',function(stage) {  
	  var container = stage.insert(new Q.UI.Container({
		x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	  }));
     
		Q.audio.play('hit.ogg');
		Q.LIFELOST++;
	  var label = container.insert(new Q.UI.Text({x:0, y: -10, fill: "#FFFFFF", color: "#FFFFFF",
													   label: stage.options.label }));

		setTimeout(function(){
			label.p.label = "Give me my sin again.";
			setTimeout(function(){
				Q.clearStages();
				if (CURRENTLEVEL<0)
					Q.stageScene('tutorial');
				else
					Q.stageScene('level' + CURRENTLEVEL);
			},2000);
		},2000);

	  container.fit(40);
});

function storyTelling(stage, msg, player, timeout){

		  var container = stage.insert(new Q.UI.Container({
			x: player.p.x, y: player.p.y, fill: "rgba(0,0,0,0.5)", opacity:0.2, radius:40
		  }));

		  var label = container.insert(new Q.UI.Text({x:0, y: -10,  color: "#FFFFFF",
														   label: msg, opacity:0.2 }));
			
			label.add("tween");
			label.animate({ opacity: 1.0}, 1, Q.Easing.Linear, {callback:function() {
				label.animate({ opacity: 0}, 1, Q.Easing.Linear, {delay: timeout});
			}});

			container.add("tween");
			container.animate({ opacity: 1.0, y:container.p.y+10 }, 1, Q.Easing.Linear, { callback: function() {		
				container.animate({ opacity: 0 }, 1, Q.Easing.Linear, { delay: timeout, callback: function(){
					container.destroy();
				}});
			}});


		  container.fit(40);
}

function randomChatters(stage,player,levelname,message) {

	setTimeout(function(){
		storyTelling(stage, (levelname==undefined?"You have entered "+GATENAME[CURRENTLEVEL-1]:levelname), player, 1);
	}, 500);

	var msg = message==undefined?CHATTERS[parseInt(Math.random()*CHATTERS.length)]:message;
	if (message!="")
	{
		setTimeout(function(){
			storyTelling(stage, msg, player, 5);
		}, 2000);
	}
}

Q.scene("level1",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 1;
	Q.STAGESARCHIVED = GATENAME[0];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 2,      // Parralax effect
                                      speedY: 2,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level1.json',  sheet: 'tiles' }));

	
	stage.insert(new Q.portals({x:3450, y: 1215, asset: GATENAME[0] + "Gate.png", nextStage: "level2"}));
	var player = stage.insert(new Q.Player({scale:0.5, y:1400}));
	stage.add("viewport").follow(player);

	randomChatters(stage, player, "Welcome to "+Q.GAME_NAME);
});

//Q.debug = false;

Q.scene("level2",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 2;
	Q.STAGESARCHIVED = GATENAME[1];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 0.5,      // Parralax effect
                                      speedY: 0.5,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level2.json',  sheet: 'tiles' }));

	stage.insert(new Q.FloatingPlatform({ x:880, y: 1000, y1:700, y2: 1500, yspeed: 2, ydirection:1, x1:880, x2:880, xspeed:0, xdirection:1 }));


	stage.insert(new Q.portals({x:3450, y: 1562, asset: GATENAME[1] + "Gate.png", nextStage: "level3"}));
	
	stage.insert(new Q.portals({x:850, y: 92, asset: GATENAME[3] + "Gate.png", nextStage: "level5"}));
	
	stage.insert(new Q.portals({x:2450, y: 932, asset: GATENAME[4] + "Gate.png", nextStage: "level6"}));
	
	var player = stage.insert(new Q.Player({scale:0.55, y:800}));
	
	stage.add("viewport").follow(player);

	randomChatters(stage, player);

});

Q.scene("level3",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }
	
	CURRENTLEVEL = 3;
	Q.STAGESARCHIVED = GATENAME[2];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 2,      // Parralax effect
                                      speedY: 2,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
									  
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level3.json',  sheet: 'tiles' }));


	stage.insert(new Q.portals({x:350, y: 302, asset: GATENAME[3] + "Gate.png", nextStage: "level5"}));
	
	stage.insert(new Q.portals({x:7750, y: 582, asset: GATENAME[0] + "Gate.png", nextStage: "level2"}));
	
	stage.insert(new Q.portals({x:7650, y: 2682, asset: GATENAME[2] + "Gate.png", nextStage: "level4"}));

	stage.insert(new Q.FloatingPlatform({ x:3400, x1:3400, x2:3400, xspeed:0, xdirection:1, y:1800, y1:1000, y2:2200, yspeed: 2, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:3550, x1:3550, x2:3550, xspeed:0, xdirection:1, y:1800, y1:1000, y2:2200, yspeed: 4, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:5200, x1:5200, x2:5900, xspeed:1, xdirection:1, y:1200, y1:1000, y2:1500, yspeed: 4, ydirection:1 }));

	var player = stage.insert(new Q.Player({scale:0.58,x:450,  y:250}));
	 // var player = stage.insert(new Q.Player({scale:0.58, x:5100,  y:1000}));
	stage.add("viewport").follow(player);

	randomChatters(stage, player);

});

Q.scene("level4",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 4;
	Q.STAGESARCHIVED = GATENAME[3];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 0.5,      // Parralax effect
                                      speedY: 0.5,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level4.json',  sheet: 'tiles' }));

	stage.insert(new Q.portals({x:700, y: 372, asset: GATENAME[1] + "Gate.png", nextStage: "level3"}));
	stage.insert(new Q.portals({x:400, y: 1842, asset: GATENAME[5] + "Gate.png", nextStage: "level7"}));
	stage.insert(new Q.portals({x:5000, y: 2332, asset: GATENAME[3] + "Gate.png", nextStage: "level5"}));

	stage.insert(new Q.FloatingPlatform({ x:4600, x1:4600, x2:4600, xspeed:0, xdirection:1, y:1800, y1:1500, y2:2700, yspeed:0.5, ydirection:1 }));

	var player = stage.insert(new Q.Player({scale:0.6, x:800, y:350}));
		// var player = stage.insert(new Q.Player({scale:0.6, x:4200, y:2000}));
	stage.add("viewport").follow(player);

	randomChatters(stage, player);
});

Q.scene("level5",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 5;
	Q.STAGESARCHIVED = GATENAME[4];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 2,      // Parralax effect
                                      speedY: 2,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level5.json',  sheet: 'tiles' }));

	
	stage.insert(new Q.portals({x:150, y: 3102, asset: GATENAME[2] + "Gate.png", nextStage: "level4"}));
	stage.insert(new Q.portals({x:2200, y: 442, asset: GATENAME[1] + "Gate.png", nextStage: "level3"}));

// stage.insert(new Q.FloatingPlatform({ x:500, y: 1000, y1:800, y2: 1500, yspeed: 2, ydirection:1, x1:900, x2:100, xspeed:2, xdirection:1 }));

	var player = stage.insert(new Q.Player({scale:1, x:300, y:3000}));
	
	stage.add("viewport").follow(player);

	randomChatters(stage, player);
});

Q.scene("level6",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 6;
	Q.STAGESARCHIVED = GATENAME[5];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 0.5,      // Parralax effect
                                      speedY: 0.5,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level6.json',  sheet: 'tiles' }));

	// stage.insert(new Q.FloatingPlatform({ x:500, y: 1000, y1:800, y2: 1500, yspeed: 2, ydirection:1, x1:900, x2:100, xspeed:2, xdirection:1 }));
	stage.insert(new Q.portals({x:100, y: 2613, asset: GATENAME[5] + "Gate.png", nextStage: "level7"}));
	stage.insert(new Q.portals({x:3400, y: 865, asset: GATENAME[0] + "Gate.png", nextStage: "level2"}));
	stage.insert(new Q.portals({x:5800, y: 2960, asset: GATENAME[6] + "Gate.png", nextStage: "level8"}));
	
	var player = stage.insert(new Q.Player({scale:0.68,x:250, y:2500}));

	stage.add("viewport").follow(player);

	randomChatters(stage, player);
});

Q.scene("level7",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.play('ingame.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 7;
	Q.STAGESARCHIVED = GATENAME[6];
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 2,      // Parralax effect
                                      speedY: 2,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level7.json',  sheet: 'tiles' }));

	stage.insert(new Q.portals({x:50, y: 933, asset: GATENAME[2] + "Gate.png", nextStage: "level4"}));
	
	stage.insert(new Q.portals({x:1700, y: 440, asset: GATENAME[4] + "Gate.png", nextStage: "level6"}));
	
	stage.insert(new Q.portals({x:3450, y: 930, asset: GATENAME[0] + "Gate.png", nextStage: "level2"}));
	
	var player = stage.insert(new Q.Player({scale:0.7, x:250, y:800}));
	
	stage.add("viewport").follow(player);

	randomChatters(stage, player);
});


Q.scene("level8",function(stage) {
	try { 
		Q.audio.stop('ingame.ogg');
		Q.audio.stop('boss.ogg');
		Q.audio.play('boss.ogg');
	 } catch(e) { }

	CURRENTLEVEL = 8;
	// Q.audio.play('boss.ogg');
	Q.STAGESARCHIVED = "Meet THE BOSS !!!";
	
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: 1,      // Parralax effect
                                      speedY: 1,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'level8.json',  sheet: 'tiles' }));

	stage.insert(new Q.FloatingPlatform({ x:5800, x1:5600, x2:6500, xspeed:2, xdirection:-1, y:150, y1:100, y2:200, yspeed: 1, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:6200, x1:5600, x2:6500, xspeed:2, xdirection:1, y:500, y1:500, y2:600, yspeed: 1, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:6600, x1:6600, x2:6600, xspeed:0, xdirection:1, y:100, y1:000, y2:600, yspeed: 2, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:6850, x1:6850, x2:6850, xspeed:0, xdirection:1, y:100, y1:000, y2:600, yspeed: 4, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:7100, x1:7100, x2:7100, xspeed:0, xdirection:1, y:100, y1:000, y2:600, yspeed: 8, ydirection:1 }));

	stage.insert(new Q.FloatingPlatform({ x:7300, x1:7300, x2:7300, xspeed:0, xdirection:1, y:100, y1:000, y2:600, yspeed: 16, ydirection:1 }));

	var boss = stage.insert(new Q.Boss({  x:8500, y:1600, x1:8000, x2:10500, y1:1500, y2:1800 }));
	boss.nextMove(0);

	var player = stage.insert(new Q.Player({scale:0.75, x:80, y:350}));

	stage.add("viewport").follow(player);

	randomChatters(stage, player, "Boss Level", "Afraid already?");

});


Q.scene("tutorial",function(stage) {

	CURRENTLEVEL = -1;
	stage.insert(new Q.Repeater({ asset: "bg01.png",
                                      speedX: .5,      // Parralax effect
                                      speedY: .5,      // Parralax effect
                                      scale: 1 }));   // Scale to fit height of window
	stage.collisionLayer(new Q.TileLayer({ tileW: Q.TILE_SIZE, tileH: Q.TILE_SIZE, dataAsset: 'tutorial.json',  sheet: 'tiles' }));

	stage.insert(new Q.portals({x:1300, y: 740, scale:1.5, asset: GATENAME[0] + "Gate.png", nextStage: "level1"}));

	stage.insert(new Q.FloatingPlatform({ x:900, x1:900, x2:940, xspeed:0.5, xdirection:-1, y:500, y1:500, y2:700, yspeed: 1, ydirection:1 }));

	  var container = stage.insert(new Q.UI.Container({
		x: 1300, y: 600, fill: "rgba(0,0,0,0.5)"
	  }));
     
	  var label = container.insert(new Q.UI.Text({ fill: "#FFFFFF", color: "#FFFFFF",
													   label: "Press 'Down' to enter Gate" }));


	var player = stage.insert(new Q.Player({scale:0.75, x:450, y:0}));
	stage.add("viewport").follow(player);

	randomChatters(stage, player, "Tutorial", "Walk, Jump, or Die. Pick one.");

	stage.destroyed = function() {
		try {
			Q.audio.stop('opening.ogg');
		} catch(e) { }		
	};
	
	statusShowHide(true);
	timerTotalTime = setInterval(function(){ Q.TOTALTIME++;updateStatus(); },1000);
});

Q.scene("opening", function(stage) {
	UIpreloader.style.display = 'none';
	try {
		Q.audio.play('opening.ogg');
	} catch(e) { }

	var box = stage.insert(new Q.UI.Container({ x: Q.width/2, y: Q.height/2 }));

	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, asset: "startbg.png" }));   

	box.insert(new Q.UI.Button({ x: -200, y: 200, scale: 0.8, asset: "startbutton.png" }))         

	button.on("click",function() {	
		Q.clearStages();
		Q.stageScene('tutorial');
	});
	  
});

Q.scene("end", function(stage) {
	try {
		Q.audio.stop('boss.ogg');
		Q.audio.play('ending.ogg');
	} catch(e) { }


	var box = stage.insert(new Q.UI.Container({ x: Q.width/2, y: Q.height/2 }));

	var bg1 = box.insert(new Q.UI.Button({ x: 0, y: 0, opacity:0, asset: "end2.png" }));
	var bg2 = box.insert(new Q.UI.Button({ x: 0, y: 0, opacity:0, asset: "end1.png" }));
	var bg3 = box.insert(new Q.UI.Text({ x: 0, y: 0, opacity:0, color: '#ffffff', label: Q.ENDING_LINES }));

	bg1.add("tween");
	bg2.add("tween");
	bg3.add("tween");

	bg3.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { callback:function() { 
		bg2.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { delay: 5, callback:function() { 
			bg3.animate({ opacity:0 });
			bg1.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { delay: 5, callback:function() { 
				bg2.animate({ opacity:0 });
				bg1.animate({ opacity:0 }, 2, Q.Easing.Linear, { delay: 5, callback:function() {
					Q.clearStages();
					Q.stageScene('credits');
				}});
			}});
		}});
	}});
});

Q.scene("credits", function(stage) {
	statusShowHide(false);
	var box = stage.insert(new Q.UI.Container({ x: Q.width/2, y: Q.height/2 }));

	var bg1 = box.insert(new Q.UI.Button({ x: 0, y: 0, opacity:0, asset: "credit1.png" }));
	var bg2 = box.insert(new Q.UI.Button({ x: 0, y: 0, opacity:0, asset: "credit2.png" }));
	var bg3 = box.insert(new Q.UI.Button({ x: 0, y: 0, opacity:0, asset: "credit3.png" }));
	var bg4 = box.insert(new Q.UI.Button({ x: 0, y: 0, opacity:0, asset: "credit4.png" }));

	bg1.add("tween");
	bg2.add("tween");
	bg3.add("tween");
	bg4.add("tween");

	bg1.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { callback:function() { 
		bg2.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { delay: 5, callback:function() { 
			bg1.animate({ opacity:0 });
			bg3.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { delay: 5, callback:function() { 
				bg2.animate({ opacity:0 });
				bg4.animate({ opacity: 1 }, 2, Q.Easing.Linear,  { delay: 5, callback:function() { 
					bg3.animate({ opacity:0 });
					bg4.animate({ opacity:0 }, 2, Q.Easing.Linear, { delay: 5, callback:function() {
						try {
							Q.audio.stop('ending.ogg');
						} catch(e) { }
						Q.clearStages();
						Q.stageScene('opening');
					}});
				}});
			}});
		}});
	}});

});


Q.load(["bg01.png","tileset1.png", "boss.png", "startbutton.png", "startbg.png", "end1.png", "end2.png", "credit1.png", "credit2.png", "credit3.png", "credit4.png",
		"tutorial.json", "level1.json", "level2.json", "level3.json", "level4.json", "level5.json", "level6.json", "level7.json", "level8.json", 
		"character.png", "EnvyGate.png", "GluttonyGate.png", "GreedGate.png", "LustGate.png", "PrideGate.png", "SlothGate.png", "WrathGate.png", 
		"coin.ogg", "fire.ogg", "heart.ogg", "hit.ogg", "jump2.ogg", "startgame.ogg", "opening.ogg", "ending.ogg", "ingame.ogg", "boss.ogg"
		], function() {
	Q.sheet("boss", "boss.png", {tilew:280, tileh:280});
	Q.sheet("tiles","tileset1.png", { tilew: Q.TILE_SIZE, tileh: Q.TILE_SIZE, frameProperties: {
		8:{sensor:true,ladder:true}, 
		4:{points:[[0,1],[1,0],[1,1]]}, 
		40:{points:[[0,1],[1,0],[1,1]]}, 
		43:{points:[[0,1],[1,0],[1,1]]}, 
		60:{points:[[0,1],[1,0],[1,1]]}, 
		
		5:{points:[[0,0],[1,1],[0,1]]}, 
		32:{points:[[0,0],[1,1],[0,1]]}, 
		41:{points:[[0,0],[1,1],[0,1]]}, 
		42:{points:[[0,0],[1,1],[0,1]]}, 

		6:{points:[[0,0],[1,0],[1,1]]}, 
		29:{points:[[0,0],[1,0],[1,1]]}, 
		
		7:{points:[[0,0],[1,0],[0,1]]},
		30:{points:[[0,0],[1,0],[0,1]]},
		
		64:{sensor:true},
		63:{sensor:true},
		62:{sensor:true},
		61:{sensor:true},
	 } });
	Q.sheet("player","character.png", { tilew: 70, tileh: 70 });
	Q.stageScene("opening");
});
