/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three", "Map", "Player", "Bullet", "GraviGoneZone"], function(THREE, Map, Player, Bullet, GraviGoneZone){
    //1024 : 640
    //16 : 10
    function Game(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -8, 8, -5, 5 , -500, 1000);
        this.camera.position.z = 100;
        this.camera.lookAt( this.scene.position );

        this.camera.position.x = 7.5;
        this.camera.position.y = 4.5;
        this.renderer = new THREE.WebGLRenderer();
        this.resize();
        document.body.appendChild( this.renderer.domElement );

        this.map = new Map();
        this.map.load("1");
        this.scene.add(this.map.object);

        this.player = new Player(this);
        this.scene.add(this.player.object);

        this.bullets = [];
        this.zones = [];

        var self = this;
        window.requestAnimationFrame(function(){
            self.render();
        });
        window.addEventListener("resize", function(){
            self.resize();
        });

        this.availableBullets = 1;
    }

    Game.prototype.addBullet = function(position, velocity){
        if(this.availableBullets > 0) {
            this.availableBullets--;
            var bullet = new Bullet(position, velocity, this);
            this.scene.add(bullet.object);
            this.bullets.push(bullet);
        }
    };

    Game.prototype.stopUpdatingBullet = function(bullet){
        this.bullets.splice(this.bullets.indexOf(bullet),1);
    };

    Game.prototype.addGraviGoneZone = function(position){
        var zone = new GraviGoneZone(position, this);
        this.scene.add(zone.object);
        this.zones.push(zone);
    };

    Game.prototype.collectGraviGoneZone = function(){
        var zone = this.zones[0];
        if(zone){
            zone.collect();
        }
    };

    Game.prototype.removeGraviGoneZone = function(zone){
        this.zones.splice(this.zones.indexOf(zone),1);
        this.scene.remove(zone.object);
        this.availableBullets++;
    };

    Game.prototype.resize = function(){
        var width = window.innerWidth;
        var height = window.innerHeight;

        if(width > height * 16/10){
            width = height * 16/10;
        } else if(height > width * 10/16){
            height = width * 10/16;
        }

        this.renderer.setSize( width, height );
        this.renderer.domElement.style.top = ((window.innerHeight - height)/2) + "px";
        this.renderer.domElement.style.left = ((window.innerWidth - width)/2) + "px";
    };

    var last = new Date().valueOf();
    Game.prototype.update = function(){
        var now = new Date().valueOf();
        var delta = now-last;
        this.player.update(delta);
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].update(delta);
        }
        for (i = 0; i < this.zones.length; i++) {
            this.zones[i].update(delta);
        }
        last = now;
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