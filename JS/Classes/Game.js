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

        this.availableBullets = 0;
        this.ui = document.createElement("div");
        this.ui.style.textAlign = "center";
        this.ui.style.positon = "absolute";
        this.ui.style.width = "100%";
        this.ui.style.height = "100%";
        this.ui.style.zIndex = "1";
        document.body.appendChild( this.ui );

        this.bulletUI = document.createElement("div");
        this.bulletUI.width = "100%";
        this.ui.appendChild(this.bulletUI);

        this.bulletDivs = [];

        this.muted = false;
    }

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
    Game.prototype.update = function(){
        var now = new Date().valueOf();
        var delta = Math.min(100, now-last);
        last = now;

        var self = this;

        this.player.update(delta);

        for (var i = 0; i < this.bullets.length; i++) {
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