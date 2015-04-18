/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three", "Map", "Player"], function(THREE, Map, Player){
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

        var self = this;
        window.requestAnimationFrame(function(){
            self.render();
        });
    }

    Game.prototype.resize = function(){
        var width = window.innerWidth;
        var height = window.innerHeight;

        if(width > height * 16/10){
            width = height * 16/10;
        } else if(height > width * 10/16){
            height = width * 10/16;
        }

        console.log(width, height);

        this.renderer.setSize( width, height );
        this.renderer.domElement.style.top = ((window.innerHeight - height)/2) + "px";
        this.renderer.domElement.style.left = ((window.innerWidth - width)/2) + "px";
    };

    var last = new Date().valueOf();
    Game.prototype.update = function(){
        var now = new Date().valueOf();
        var delta = now-last;
        this.player.update(delta);
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
        return new THREE.Vector2(0, 10);
    };

    Game.prototype.getCollisions = function(actor){
        return this.map.getCollisions(actor);
    };

    return Game;
});