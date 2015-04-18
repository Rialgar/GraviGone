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

        var i = 0;
        var j;

        for (j in controllers) {
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
        for (j in controllers) {
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

    function Player(game){
        this.imageSize = {
            width: 30,
            height: 48,
            tileWidth: 13,
            tileHeight: 22
        };
        this.animations = {
            "idle": [
                {x:1, y:1, t:250},
                {x:16, y:1, t:250}
            ],
            "jump": [
                {x:16, y:25, t:250},
                {next: "air"}
            ],
            "air": [
                {x:1, y:25, t:500}
            ]
        };

        Actor.call(this, "Player", game);

        var self = this;

        var down = [];
        window.addEventListener("keydown", function(evt){
            var code = evt.keyCode;
            if(code >= 0x20 && code <= 0x5A){
                evt.preventDefault();
                if(!down[code]){
                    down[code] = true;
                    self.keyDown(code);
                }
            }
        });
        window.addEventListener("keyup", function(evt){
            var code = evt.keyCode;
            if(code >= 0x20 && code <= 0x5A){
                evt.preventDefault();
                if(down[code]){
                    down[code] = false;
                    self.keyUp(code);
                }
            }
        });

        this.velKeyBoard = new THREE.Vector2();
        this.jumped = 0;
        this.gpJumpPressed = false;
        this.maxJumps = 1;
    }

    Player.prototype = Object.create(Actor.prototype);

    Player.prototype.land = function(){
        this.jumped = 0;
        Player.prototype.constructor.prototype.land.call(this);
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
        }
        if(this.velKeyBoard.x != 0) {
            this.velocity.x = this.velKeyBoard.x;
        }

        Player.prototype.constructor.prototype.update.call(this, delta);
    };

    Player.prototype.jump = function(){
        if(this.jumped < this.maxJumps){
            this.jumped++;
            this.velocity.y = -5;
            this.setAnimationState("jump",0,0);
        }
    };

    Player.prototype.keyDown = function(code){
        if(code == 0x25 || code == 0x41){ //left or A
            this.velKeyBoard.x -= 3;
        } else if(code == 0x27 || code == 0x44) { //right or D
            this.velKeyBoard.x += 3;
        } else if(code == 0x26 || code == 0x57) { //up or W
            this.jump();
        } else if(code == 0x20) { //space
            this.fire();
        }
    };

    Player.prototype.keyUp = function(code){
        if(code == 0x25 || code == 0x41){ //left or A
            this.velKeyBoard.x += 3;
        } else if(code == 0x27 || code == 0x44) { //right or D
            this.velKeyBoard.x -= 3;
        }
    };



    return Player;
});