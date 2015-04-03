(function () {

	'use strict';

	/*jslint browser: true*/
	/*global Phaser, console*/

	var game = new Phaser.Game(320, 480, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render})
	, bat,	spikes, ground, sky, scoreWalls, playButton, flap_sound, death_sound, scoreText, timer, clickListener, bloodEmitter
	, preloadSprite, instructionsText, fullScreenButton, tweetButton
	,	isRunning = false
	,	score = 0
	,	spawnTime = 1800
	, SPIKE_STARTING_X = 410
	,	SPIKE_VELOCITY_X = -150
	,	BAT_VELOCITY_Y = -450
	, SPIKE_GAP = 150
	,	MAX_SPIKE_HEIGHT = 480 - 64 - SPIKE_GAP // Game size  - ground size - desired space between spikes
	,	SPIKE_WIDTH = 100
	,	GROUND_SCROLL_SPEED = SPIKE_VELOCITY_X;

	function preload() {

		var bar = game.add.bitmapData(100,100);
		bar.ctx.fillStyle = '#FFF';
    bar.ctx.fillRect(0,0,100,100);
		preloadSprite = game.add.sprite(game.world.centerX,game.world.centerY,bar);
		preloadSprite.anchor.setTo(0.5)
		preloadSprite.width = game.width / 2 ;
		preloadSprite.height = 20;
		game.load.setPreloadSprite(preloadSprite);

    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

		game.load.image('play_button', 'assets/play_button.png');
		game.load.image('fullScreenButton', 'assets/fullScreenButton.png');
		game.load.image('twitterIcon', 'assets/twitter-icon.png');
		game.load.image('sky', 'assets/background.png');
		game.load.image('ground', 'assets/ground.png');
		game.load.atlasJSONHash('bat', 'assets/bat.png', 'assets/bat.js');
		game.load.image('spikes_up', 'assets/spikes_up.png');
		game.load.image('spikes_down', 'assets/spikes_down.png');
		game.load.image('blood_1', 'assets/blood_1.png');
		game.load.image('blood_2', 'assets/blood_2.png');
		game.load.image('blood_3', 'assets/blood_3.png');
		game.load.audio('death', 'assets/death.wav');
		game.load.audio('flap', 'assets/flap.wav');

	}

	function create() {

		preloadSprite.kill();

		/** Since the spikes will be spawned outside the screen,
		/*	the world should be set a bit bigger on the X axis
		*/
		game.world.setBounds(0, 0, 500, 480);
		game.stage.smoothed = false;

		flap_sound = game.add.audio('flap');
		death_sound = game.add.audio('death');
		//  We're going to be using physics, so enable the Arcade Physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);

		//  A simple background for our game
		sky = game.add.tileSprite(0, 0, 320, 416, 'sky');
		sky.startingX = sky.x; //Save X/Y Values. We will be resetting the position on game reset.
		sky.startingY = sky.y;

		spikes = game.add.group();
		spikes.createMultiple(20, 'spikes_up');

		//Invisible walls that increase score on collision
		scoreWalls = game.add.group();
		scoreWalls.enableBody = true;
		scoreWalls.createMultiple(10);

		scoreText = game.add.text(game.width / 2, 50, '0', { font: 'bold 32px Comic Sans MS', fill: 'black' });
		scoreText.anchor.setTo(0.5)


		instructionsText = game.add.text(game.width / 2, 50, '0', { font: 'bold 15px Comic Sans MS', fill: 'black' });
		instructionsText.anchor.setTo(0.5)
		instructionsText.visible = false;

		// The bat and its settings
		bat = game.add.sprite(game.width / 2, game.height / 2, 'bat' ,'bat_1.png');
		bat.animations.add('fly',Phaser.Animation.generateFrameNames('bat_', 1, 2, '.png'), 10, true);
		bat.anchor.setTo(0.5, 0.5); //Set anchor to the middle for better angle control
		//Bat's physics
		game.physics.arcade.enable(bat);
		bat.body.gravity.y = 2000;
		bat.body.maxVelocity.setTo(500,800);
		bat.body.collideWorldBounds = true;

		//Moving ground
		ground = game.add.tileSprite(0, game.height - 64, game.width, 64, 'ground');
		ground.startingX = ground.x;//Save X/Y Values. We will be resetting the position on game reset.
		ground.startingY = ground.y;
		ground.autoScroll(GROUND_SCROLL_SPEED, 0);
		game.physics.arcade.enable(ground);
		ground.body.immovable = true;
		ground.body.setSize(ground.width, ground.height - 10, 0, 10);

		playButton = game.add.button(game.width / 2 - 52 , game.height / 2 - 30, 'play_button', resetGame);
		animate(playButton)

		fullScreenButton = game.add.button(10,  game.height - 30 , 'fullScreenButton', goFull);
		fullScreenButton.anchor.setTo(0.5, 0.5);
		fullScreenButton.x = 10 +fullScreenButton.width / 2;
		fullScreenButton.y = game.height - fullScreenButton.height;
		fullScreenButton.width = 30;
		fullScreenButton.height = 30;

		tweetButton = game.add.button(10, 0, 'twitterIcon', tweet);
		tweetButton.y = game.height - 60;
		tweetButton.width = 50;
		tweetButton.height = 50;
		animate(tweetButton)

		if (!game.scale.compatibility.supportsFullScreen || game.device.desktop){

			fullScreenButton.visible = false;

		}else{

			game.scale.onFullScreenChange.add(
				function fullScreenChange (){
					if(!game.scale.isFullScreen){fullScreenButton.visible = true;}
				}
			)
		}

		bloodEmitter = game.add.emitter(game.world.centerX, 100, 100);
		bloodEmitter.gravity =500;
		bloodEmitter.minParticleScale = 2;
		bloodEmitter.maxParticleScale = 8;
    bloodEmitter.makeParticles(['blood_1', 'blood_2', 'blood_3'],0,400);
		bloodEmitter.maxParticleSpeed.setTo(400,400);
		bloodEmitter.minParticleSpeed.setTo(-400,-400);
		bloodEmitter.minParticleAlpha = 0.5
		bloodEmitter.maxParticleAlpha = 0.5

		clickListener = game.input.onDown.add(clicked);
		resetGame();
		instructionsText.text='';
		menu();

	}

	function update() {

		game.physics.arcade.collide(bat, ground, touchedSpike);

		if (isRunning) {

			game.physics.arcade.overlap(bat, scoreWalls, scoreIncr);
			game.physics.arcade.overlap(bat, spikes, touchedSpike);

			if (bat.body.velocity.y < 0 && bat.body.rotation > -20) {

				bat.body.rotation += -10;

			} else if (bat.body.velocity.y > 0 && bat.body.rotation < 90) {

				bat.body.rotation += 2;

			}

		}

	};

	function addSpikes() {

		var y = game.rnd.integerInRange(0, MAX_SPIKE_HEIGHT)
				, spikeUp, spikeDown, scoreWall;

		spikeUp = addSpike(SPIKE_STARTING_X, -MAX_SPIKE_HEIGHT + y);
		spikeDown= addSpike(SPIKE_STARTING_X,  game.height - 64 -(MAX_SPIKE_HEIGHT - y ), 'spikes_down');

		addScoreWall(spikeUp.y + spikeUp.height);

	}

	function addSpike (x, y, key) {

		x = x || SPIKE_STARTING_X;
		y = y || 0;
		key = key || 'spikes_up';

		var spikePart  = spikes.getFirstDead();

		if(spikePart.key!==key){spikePart.loadTexture(key);};

		spikePart.reset(x,y);
		spikePart.height = MAX_SPIKE_HEIGHT;

		//physics settings
		game.physics.arcade.enable(spikePart);
		spikePart.body.immovable = true;
		spikePart.body.velocity.x = SPIKE_VELOCITY_X;
		spikePart.checkWorldBounds = true;
		spikePart.outOfBoundsKill = true;

		return spikePart;

	}

	function addScoreWall (height) {

		var scoreWall = scoreWalls.getFirstDead();

		scoreWall.reset(SPIKE_STARTING_X + SPIKE_WIDTH, height);
		game.physics.arcade.enable(scoreWall);
		game.physics.arcade.enable(scoreWall);
		scoreWall.body.velocity.x = SPIKE_VELOCITY_X;
		scoreWall.height = SPIKE_GAP;

	}

	function touchedSpike() {

		if (!isRunning)return;

		instructionsText.text = 'l3l nab u got r3kt brah';
		instructionsText.visible = true;
		scoreText.visible = false;

		isRunning = false;
		clickListener.active = false;
		game.time.events.remove(timer);

		bloodEmitter.x = bat.x;
		bloodEmitter.y = bat.y;
		bloodEmitter.explode(3000, 200);

		ground.autoScroll(0, 0);
		sky.autoScroll(0, 0);

		spikes.setAll('body.velocity.x', 0, true);
		scoreWalls.setAll('body.velocity.x', 0, true);

		bat.animations.stop();
		bat.frameName =  'bat_dead.png';

		fade(ground);
		shake(ground);
		fade(sky);
		shake(sky);
		fade(spikes);
		shake(spikes);
		fade(bat);


		death_sound.play();
		game.time.events.add(400, function () {
					instructionsText.text = 'Passed '+score+' before diving to death.';
					menu();
		}, this);

	}

	function fade(obj) {

		game.add.tween(obj).to({alpha:0}, 200, Phaser.Easing.Default)
		.to({alpha:1}, 200, Phaser.Easing.Default)
		.start();

	}

	function shake(obj) {

		game.add.tween(obj).to({
				x:""+game.rnd.integerInRange(-10,10)
			, y:""+game.rnd.integerInRange(-5,5)
		}, 50, Phaser.Easing.Default, true, 0, 10, true);

	}

	function clicked() {

		if (playButton.visible) return;

		if(!isRunning)startGame()
		bat.body.velocity.y = BAT_VELOCITY_Y;
		flap_sound.play();

	}

	function startGame () {

		scoreText.visible = true;
		instructionsText.visible = false;
		bat.body.moves = true;
		isRunning = true;
		addSpikes()
		timer = game.time.events.loop(spawnTime, addSpikes);

	}

	function resetGame () {

			score = 0;
			scoreText.text = score;
			scoreText.visible = false;
			instructionsText.visible = true;
			instructionsText.text = 'Click to make that thing fly.'
			game.tweens.removeAll();

			resetBat()
			spikes.forEachAlive(killObj);
			scoreWalls.forEachAlive(killObj);
			//Stop scroll and reset the position in case the shake tween stopped prematurally
			ground.autoScroll(GROUND_SCROLL_SPEED, 0);
			ground.x = ground.startingX;
			ground.y = ground.startingY;

			sky.autoScroll(GROUND_SCROLL_SPEED, 0);
			sky.x = sky.startingX;
			sky.y = sky.startingY;

			playButton.visible = false;
			tweetButton.visible = false;
			clickListener.active = true;

	}

	function resetBat () {

			bat.animations.play('fly');
			bat.body.moves = false;
			bat.reset(game.width / 2, game.height / 2);
			bat.angle = 0;

	}

	function menu () {

		playButton.visible = true;
		tweetButton.visible = true;

	}

	function scoreIncr(bat, scoreWall) {

		scoreWall.kill();
		score += 1;
		scoreText.text = score;
	}

	function killObj(obj) {
		obj.kill();
		obj.body.destroy();
	}

	function render() {

//		spikes.forEachAlive(renderBody,this);
//		scoreWalls.forEachAlive(renderBody,this);
//		renderBody(ground)
	}

	function renderBody(obj) {
		game.debug.body(obj)
		//game.debug.body(obj,'rgba('+game.rnd.integerInRange(1,255)+','+game.rnd.integerInRange(1,255)+','+game.rnd.integerInRange(1,255)+',1)');
	}

	function goFull(){

		fullScreenButton.visible = false;
		game.scale.startFullScreen();

	}

	function tweet (){

			var tweetText =  'I just played Gory Bat!';
			if(score !== 0 ) tweetText = 'I just scored '+ score + ' at Gory Bat!';
			window.open("https://twitter.com/intent/tweet?text=" + tweetText + " @j0hnskot&url=" + window.location.href, "" ,"width=550, height=425");
	}

	function  animate (entity) {


		entity.startX = entity.x;
		entity.startY = entity.y;
		entity.startWidth = entity.width;
		entity.startHeight = entity.height;


		entity.events.onInputDown.add(function (self) {

			self.y += 2;
			self.x -= 4;
			self.width += 10;
		});

		entity.events.onInputUp.add(function (self) {

			self.x = self.startX;
			self.y = self.startY;
			self.width = self.startWidth;

		});

		entity.events.onInputOver.add(function (self) {

			self.y += 2;
			self.x -= 4;
			self.width += 5;

		});

		entity.events.onInputOut.add(function (self) {

			self.x = self.startX;
			self.y = self.startY;
			self.width = self.startWidth;

		});

}

}());
