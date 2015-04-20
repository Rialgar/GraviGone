/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three", "Map", "Player", "Bullet", "GraviGoneZone", "Collectible"], function(THREE, Map, Player, Bullet, GraviGoneZone, Collectible){
    //1024 : 640
    //16 : 10
    function Game(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -8, 8, -5, 5 , -500, 1000);
        this.camera.position.z = 100;
        this.camera.lookAt( this.scene.position );

        this.cameraMin = new THREE.Vector2(7.5, 4.5);
        this.camPos = this.cameraMin.clone();

        this.camera.position.x = this.camPos.x;
        this.camera.position.y = this.camPos.y;
        this.renderer = new THREE.WebGLRenderer();
        this.resize();
        document.body.appendChild( this.renderer.domElement );
        this.renderer.domElement.style.zIndex = "-1";
        this.renderer.domElement.style.position = "absolute";
        this.renderer.domElement.style.top = "0";
        this.renderer.domElement.style.left = "0";

        this.bullets = [];
        this.zones = [];
        this.collectibles = [];

        this.map = new Map(this);
        this.map.load("1");
        this.scene.add(this.map.object);

        this.cameraMax = this.map.dimensions.clone().sub(this.cameraMin).subScalar(1);

        var self = this;
        window.requestAnimationFrame(function(){
            self.render();
        });
        window.addEventListener("resize", function(){
            self.resize();
        });

        this.maxBullets = 0;
        this.availableBullets = 0;
        this.ui = document.createElement("div");
        this.ui.style.textAlign = "center";
        this.ui.style.positon = "absolute";
        this.ui.style.width = "100%";
        this.ui.style.height = "100%";
        this.ui.style.zIndex = "10";
        document.body.appendChild( this.ui );

        this.bulletUI = document.createElement("div");
        this.bulletUI.style.width = "100%";
        this.ui.appendChild(this.bulletUI);

        this.messageUI = document.createElement("div");
        this.messageUI.style.width = "100%";
        this.messageUI.style.opacity = "0";
        this.messageUI.style.transition = "opacity 0.2s";
        this.messageUI.style.webkitTransition = "opacity 0.2s";

        this.messageUI.style.marginTop = "20px";
        this.messageUI.style.padding = "5px";
        this.messageUI.style.fontSize = "24pt";
        this.messageUI.style.color = "white";
        this.messageUI.style.backgroundColor = "rgba(0,0,0,0.5)";

        this.ui.appendChild(this.messageUI);

        this.bulletDivs = [];

        this.muted = false;

        this.messages = [
            { msg:"Welcome!", trigger: "time", t:1000, length:2000},
            { msg:"You can Play via Keyboard, but I optimized for Gamepads.", trigger: "time", t:500, length:5000},
            { msg:"Use left Stick, WASD or Arrow Keys to move.", trigger: "time", t:500, length:5000},
            { msg:"Toggle Sound with M.", trigger: "time", t:500, length:3000},
            { msg:"(You can change the key bindings anytime by pressing Escape)", trigger: "time", t:500, length:5000},
            { msg:"Jump with Space, X, E, H or Green (A) on your Gamepad.", trigger: "location", location: new THREE.Vector2(3.5, 5.9), length:9000},
            { msg:"You collected your first GraviGone Cartridge.", trigger: "collection", count: 1, length:5000},
            { msg:"It allows you to fire a GraviGone Seed.", trigger: "time", t: 500, length:5000},
            { msg:"Fire with C, E, F, J, L or Blue (X) on your Gamepad.", trigger: "time", t: 500, length:9000},
            { msg:"The Seed creates a GraviGone field on Impact.", trigger: "time", t: 500, length:5000},
            { msg:"Gravity is reduced inside GraviGone fields.", trigger: "time", t: 500, length:5000},
            { msg:"You can shoot again once the GraviGone field decayed after 5 seconds.", trigger: "time", t: 500, length:5000},
            { msg:"You can collect the GraviGone field early with K, R, V, Num0 or Red (B) on your Gamepad.", trigger: "time", t: 500, length:10000},
            { msg:"Congratulations, you found your second GraviGone Cartridge.", trigger: "collection", count: 2, length:5000},
            { msg:"You can now place two GraviGone fields to jump higher and farther.", trigger: "time", t:500, length:5000},
            { msg:"Where two or more GraviGone fields overlap, the gravity is even more reduced.", trigger: "time", t:500, length:5000},
            { msg:"Hooray!, You found the remaining GraviGone Cartridges.", trigger: "collection", count: 8, length:5000},
            { msg:"With that many fields, you could climb any wall!", trigger: "time", t:500, length:10000},
            { msg:"<br/><br/><br/>Well done!<br/>You reached the end of the game!<br/>I hope you liked it.<br/><br/><br/>", trigger: "location", location: new THREE.Vector2(36, 35.9), length:60000}
        ];
        this.nextMessage = 0;
        this.showNextMessage();
    }

    Game.prototype.showNextMessage = function(time){
        time = Math.max(time || 0, 500);
        var message = this.messages[this.nextMessage];
        if(!message){
            return;
        }
        var self = this;
        function show(){
            self.showMessage(message.msg, message.length);
            self.nextMessage++;
            self.showNextMessage(message.length);
        }
        if(message.trigger == "time"){
            window.setTimeout(show, time + message.t);
        } else {
            if(message.triggered){
                window.setTimeout(show, time);
            }else{
                var now = new Date().valueOf();
                message.onTrigger = function(){
                    window.setTimeout(show, Math.max(0, time - (new Date().valueOf() - now)));
                }
            }
        }
    };

    Game.prototype.toggleSounds = function(){
        this.muted = !this.muted;
    };

    Game.prototype.createPlayer = function(position){
        if(this.player){
            console.error("Tried to create two players");
            return;
        }
        this.player = new Player(position, this);
        this.scene.add(this.player.object);
        this.scene.add(this.player.arrow.object);
    };

    Game.prototype.addAvailableBullet = function(){
        var div = document.createElement("div");
        div.style.borderColor = "#b051cf";
        div.style.borderRadius = "20px";
        div.style.borderWidth = "10px";
        div.style.borderStyle = "ridge";
        div.style.margin = "5px";
        div.style.display = "inline-block";
        div.style.width = "40px";
        div.style.height = "80px";
        this.bulletUI.appendChild(div);
        this.bulletDivs.push(div);

        this.bulletDivs[this.availableBullets].style.backgroundColor = "#d964ff";
        this.availableBullets++;
        this.maxBullets++;

        for (var i = this.nextMessage; i < this.messages.length; i++) {
            var message = this.messages[i];
            if (message.trigger == "collection" && !message.triggered && message.count <= this.maxBullets) {
                if (message.onTrigger){
                    message.onTrigger();
                }
                message.triggered = true;
            }
        }
    };

    Game.prototype.addObject = function(name, position){
        if(name == "Player"){
            this.createPlayer(position);
        } else {
            var coll = new Collectible(name, position, this);
            this.collectibles.push(coll);
            this.scene.add(coll.object);
        }
    };

    Game.prototype.addBullet = function(position, velocity){
        if(this.availableBullets > 0) {
            this.availableBullets--;
            this.bulletDivs[this.availableBullets].style.backgroundColor = "transparent";
            var bullet = new Bullet(position, velocity, this);
            this.scene.add(bullet.object);
            this.bullets.push(bullet);
            return true;
        }
        return false;
    };

    Game.prototype.addGraviGoneZone = function(position){
        var zone = new GraviGoneZone(position, this);
        this.scene.add(zone.object);
        this.zones.push(zone);
        return zone;
    };

    Game.prototype.collectGraviGoneZone = function(){
        for (i = 0; i < this.zones.length; i++) {
            var zone = this.zones[i];
            if (zone && !zone.collected) {
                return zone.collect();
            }
        }
    };

    Game.prototype.removeGraviGoneZone = function(zone){
        this.scene.remove(zone.object);
        this.bulletDivs[this.availableBullets].style.backgroundColor = "#d964ff";
        this.availableBullets++;
    };

    Game.prototype.showMessage = function(message, time){
        if(this.hideMessageTimeOut){
            window.clearTimeout(this.hideMessageTimeOut);
            this.hideMessageTimeOut = false;
        } else {
            this.messageUI.innerHTML = "";
        }
        this.messageUI.innerHTML = this.messageUI.innerHTML + message + "<br/>";
        this.messageUI.style.opacity = "1";

        var self = this;
        this.hideMessageTimeOut = window.setTimeout(function(){
            self.messageUI.style.opacity = "0";
            self.hideMessageTimeOut = false;
        },time);
        return this.messageUI;
    };

    Game.prototype.resize = function(){
        var width = window.innerWidth;
        var height = window.innerHeight;

        this.renderer.setSize( width, height );

        if(width > height * 16/10){
            width *= 10/height;
            height = 10;
        } else if(height > width * 10/16){
            height *= 16/width;
            width = 16;
        }

        this.camera.left = -width/2;
        this.camera.right = width/2;
        this.camera.top = -height/2;
        this.camera.bottom = height/2;

        this.camera.updateProjectionMatrix();
    };

    var last = new Date().valueOf();
    Game.prototype.update = function() {
        var now = new Date().valueOf();
        var delta = Math.min(100, now - last);
        last = now;

        var self = this;

        this.player.update(delta);

        for (var i = this.nextMessage; i < this.messages.length; i++) {
            var message = this.messages[i];
            if (message.trigger == "location" && !message.triggered && message.location.distanceToSquared(this.player.position) <= 1) {
                if (message.onTrigger){
                    message.onTrigger();
                }
                message.triggered = true;
            }
        }

        for (i = 0; i < this.bullets.length; i++) {
            this.bullets[i].update(delta);
        }
        this.bullets = this.bullets.filter(function(b){
            return b.currentAnimation != "scorch";
        });

        for (i = 0; i < this.collectibles.length; i++) {
            this.collectibles[i].update(delta);
            this.collectibles[i].checkCollission(this.player);
        }
        this.collectibles = this.collectibles.filter(function(c){
            if(c.collected){
                self.scene.remove(c.object);
                return false;
            } else{
                return true;
            }
        });

        for (i = 0; i < this.zones.length; i++) {
            this.zones[i].update(delta);
        }
        this.zones = this.zones.filter(function(z){
            if(z.needsRemoval){
                self.removeGraviGoneZone(z);
                return false;
            } else {
                return true;
            }
        });

        var camMovement = this.player.position.clone();
        camMovement.max(this.cameraMin);
        camMovement.min(this.cameraMax);
        camMovement.sub(this.camPos);
        if(camMovement.length() > 0.1) {
            camMovement.multiplyScalar(delta / 500);
        } else if(camMovement.length() > 0.1/500){
            camMovement.setLength(0.1/500);
        }
        this.camPos.add(camMovement);

        this.camera.position.x = this.camPos.x;
        this.camera.position.y = this.camPos.y;
    };

    Game.prototype.render = function(){
        this.update();
        var self = this;
        window.requestAnimationFrame(function(){
            self.render();
        });
        this.renderer.render( this.scene, this.camera );
    };

    Game.prototype.accelerationAt = function(position){
        var out = new THREE.Vector2(0, 10);
        for (var i = 0; i < this.zones.length; i++) {
            if(this.zones[i].contains(position)){
                out.multiplyScalar(0.25);
            }
        }
        return out;
    };

    Game.prototype.getCollisions = function(collidable){
        return this.map.getCollisions(collidable);
    };

    return Game;
});