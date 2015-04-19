/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three", "Actor"], function(THREE, Actor){
    var haveEvents = 'ongamepadconnected' in window;
    var controllers = {};
    function connecthandler(e) {
        addgamepad(e.gamepad);
    }

    function addgamepad(gamepad) {
        controllers[gamepad.index] = gamepad;
        console.log("gamepad connected: " + gamepad.mapping);
    }

    function disconnecthandler(e) {
        removegamepad(e.gamepad);
    }

    function removegamepad(gamepad) {
        delete controllers[gamepad.index];
    }

    function getGamePad() {
        if (!haveEvents) {
            scangamepads();
        }

        for (var j in controllers) {
            var controller = controllers[j];

            if(controller.mapping == "standard"){
                return controller;
            }
        }
    }

    function scangamepads() {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                if (gamepads[i].index in controllers) {
                    controllers[gamepads[i].index] = gamepads[i];
                } else {
                    addgamepad(gamepads[i]);
                }
            }
        }
        for (var j in controllers) {
            var controller = controllers[j];
            if(!controller.connected){
                removegamepad(controller);
            }
        }
    }

    window.addEventListener("gamepadconnected", connecthandler);
    window.addEventListener("gamepaddisconnected", disconnecthandler);

    if (!haveEvents) {
        setInterval(scangamepads, 500);
    }

    var superclass = Actor;

    var keys = [];
    keys[0x20] = "Space";
    keys[0x25] = "ArrowLeft";
    keys[0x26] = "ArrowUp";
    keys[0x27] = "ArrowRight";
    keys[0x28] = "ArrowDown";
    keys[0x30] = "0";
    keys.push("1");
    keys.push("2");
    keys.push("3");
    keys.push("4");
    keys.push("5");
    keys.push("6");
    keys.push("7");
    keys.push("8");
    keys.push("9");

    keys[0x41] = "A";
    keys.push("B");
    keys.push("C");
    keys.push("D");
    keys.push("E");
    keys.push("F");
    keys.push("G");
    keys.push("H");
    keys.push("I");
    keys.push("J");
    keys.push("K");
    keys.push("L");
    keys.push("M");
    keys.push("N");
    keys.push("O");
    keys.push("P");
    keys.push("Q");
    keys.push("R");
    keys.push("S");
    keys.push("T");
    keys.push("U");
    keys.push("V");
    keys.push("W");
    keys.push("X");
    keys.push("Y");
    keys.push("Z");

    keys[0x60] = "Num0";
    keys.push("Num1");
    keys.push("Num2");
    keys.push("Num3");
    keys.push("Num4");
    keys.push("Num5");
    keys.push("Num6");
    keys.push("Num7");
    keys.push("Num8");
    keys.push("Num9");

    function Player(position, game){
        superclass.call(this, "Player", position, game);

        var self = this;

        var down = [];
        this.lastKey = 0;
        window.addEventListener("keydown", function(evt){
            var code = evt.keyCode;
            if(code >= 0x20 && code <= 0x60){
                self.lastKey = new Date().valueOf();
                evt.preventDefault();
                if(!down[code]){
                    down[code] = true;
                    self.keyDown(code);
                }
            } else if (code == 0x1B){
                if(window.confirm("Change KeyBindings?")) {
                    for (var key in self.bindings) {
                        var input =  window.prompt(key, self.bindings[key]);
                        self.bindings[key] = input.split(",");

                    }
                }
            }
        });
        window.addEventListener("keyup", function(evt){
            var code = evt.keyCode;
            if(code >= 0x20 && code <= 0x60){
                self.lastKey = new Date().valueOf();
                evt.preventDefault();
                if(down[code]){
                    down[code] = false;
                    self.keyUp(code);
                }
            }
        });

        this.bindings = {
            down: ["S", "ArrowDown"],
            up: ["W", "ArrowUp"],
            left: ["A", "ArrowLeft"],
            right: ["D", "ArrowRight"],
            jump: ["Space", "X", "E", "H"],
            fire: ["C", "E", "F", "J", "L"],
            collectZone: ["K", "R", "V", "Num0"]
        };

        this.velKeyBoard = new THREE.Vector2();
        this.jumped = 0;
        this.gpJumpPressed = false;
        this.maxJumps = 1;

        this.gpFirePressed = false;

        this.driveSound1 = new Audio("./sounds/drive.wav");
        this.driveSound2 = new Audio("./sounds/drive.wav");
        var oneToTwo = function(){
            self.driveSound1.pause();
            self.driveSound1.currentTime = 0;
            self.driveSound2.play();
            window.setTimeout(twoToOne,1000);
        };
        var twoToOne = function(){
            self.driveSound2.pause();
            self.driveSound2.currentTime = 0;
            self.driveSound1.play();
            window.setTimeout(oneToTwo,1000);
        };
        window.setTimeout(oneToTwo,1000);
        this.driveSound1.play();

        this.jumpSounds = [
            new Audio("./sounds/jump.wav"),
            new Audio("./sounds/jump.wav"),
            new Audio("./sounds/jump.wav"),
            new Audio("./sounds/jump.wav"),
            new Audio("./sounds/jump.wav"),
            new Audio("./sounds/jump.wav"),
            new Audio("./sounds/jump.wav")
        ];

        for (var i = 0; i < this.jumpSounds.length; i++) {
            this.jumpSounds[i].volume = 0.2;
        }

        this.fireSounds = [
            new Audio("./sounds/shoot.wav"),
            new Audio("./sounds/shoot.wav"),
            new Audio("./sounds/shoot.wav"),
            new Audio("./sounds/shoot.wav"),
            new Audio("./sounds/shoot.wav"),
            new Audio("./sounds/shoot.wav")
        ];

        for (i = 0; i < this.fireSounds.length; i++) {
            this.fireSounds[i].volume = 0.2;
        }
    }

    Player.prototype = Object.create(superclass.prototype);

    Player.prototype.driveSoundOff = function(){
        this.driveSound1.muted = true;
        this.driveSound2.muted = true;
    };

    Player.prototype.driveSoundOn = function(){
        this.driveSound1.muted = this.game.muted;
        this.driveSound2.muted = this.game.muted;
    };

    Player.prototype.land = function(){
        this.jumped = 0;
        superclass.prototype.land.call(this);
    };

    Player.prototype.update = function(delta){
        var gp = getGamePad();
        if(gp && gp.connected){
            if(Math.abs(gp.axes[0]) > 0.13) {
                this.velocity.x = gp.axes[0] * 3;
            } else {
                this.velocity.x = 0;
            }
            if(gp.buttons[0] == 1.0 || gp.buttons[0].pressed){
                if(!this.gpJumpPressed){
                    this.gpJumpPressed = true;
                    this.jump();
                }
            } else {
                this.gpJumpPressed = false;
            }
            if(gp.buttons[2] == 1.0 || gp.buttons[2].pressed){
                if(!this.gpFirePressed){
                    this.gpFirePressed = true;
                    this.fire();
                }
            } else {
                this.gpFirePressed = false;
            }
            if(gp.buttons[1] == 1.0 || gp.buttons[1].pressed){
                if(!this.gpCollectPressed){
                    this.gpCollectPressed = true;
                    this.collect();
                }
            } else {
                this.gpCollectPressed = false;
            }
            /*if(gp.buttons[9] == 1.0 || gp.buttons[9].pressed){
                window.location = window.location;
            }
            if(gp.buttons[8] == 1.0 || gp.buttons[8].pressed){
                this.game.addAvailableBullet();
            }*/
        }
        if(this.lastKey > new Date().valueOf()-1000) {
            this.velocity.x = this.velKeyBoard.x;
        }

        superclass.prototype.update.call(this, delta);

        if(this.velocity.x != 0 && this.velocity.y == 0){
            this.driveSoundOn();
        } else {
            this.driveSoundOff();
        }
    };

    Player.prototype.jump = function(){
        if(this.jumped < this.maxJumps){
            this.jumped++;
            this.velocity.y = -5;
            this.setAnimationState("jump",0,0);
            var sound = this.jumpSounds.shift();
            sound.play();
            this.jumpSounds.push(sound);
        }
    };

    Player.prototype.fire = function(){
        var bulletVelocity = this.velKeyBoard.clone();
        if(bulletVelocity.lengthSq() == 0){
            var gp = getGamePad();
            bulletVelocity.x = Math.abs(gp.axes[0]) > 0.13 ? gp.axes[0] : 0;
            bulletVelocity.y = Math.abs(gp.axes[1]) > 0.13 ? gp.axes[1] : 0;
            if(bulletVelocity.lengthSq() == 0) {
                bulletVelocity.x = (this.direction == "left") ? -1 : 1;
            }
        }
        bulletVelocity.setLength(5);
        if(this.game.addBullet(this.position.clone(), bulletVelocity)){
            var sound = this.fireSounds.shift();
            sound.play();
            this.fireSounds.push(sound);
        }
    };

    Player.prototype.collect = function(){
        this.game.collectGraviGoneZone();
    };

    Player.prototype.keyDown = function(code){
        var keyName = keys[code];
        console.log(keyName);
        if(this.bindings.left.indexOf(keyName) >= 0){
            this.velKeyBoard.x -= 3;
        } else if(this.bindings.right.indexOf(keyName) >= 0) {
            this.velKeyBoard.x += 3;
        } else if(this.bindings.down.indexOf(keyName) >= 0) {
            this.velKeyBoard.y += 3;
        } else if(this.bindings.up.indexOf(keyName) >= 0) {
            this.velKeyBoard.y -= 3;
        } else if(this.bindings.jump.indexOf(keyName) >= 0) {
            this.jump();
        } else if(this.bindings.fire.indexOf(keyName) >= 0) {
            this.fire();
        } else if(this.bindings.collectZone.indexOf(keyName) >= 0) {
            this.collect();
        }
    };

    Player.prototype.keyUp = function(code){
        var keyName = keys[code];
        if(this.bindings.left.indexOf(keyName) >= 0){
            this.velKeyBoard.x += 3;
        } else if(this.bindings.right.indexOf(keyName) >= 0) {
            this.velKeyBoard.x -= 3;
        } else if(this.bindings.down.indexOf(keyName) >= 0) {
            this.velKeyBoard.y -= 3;
        } else if(this.bindings.up.indexOf(keyName) >= 0) {
            this.velKeyBoard.y += 3;
        }
    };



    return Player;
});