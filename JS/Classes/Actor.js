/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three"], function(THREE){
    function Actor(name, game){
        this.game = game;

        this.geometry = new THREE.PlaneGeometry(13/32, 22/32);
        this.geometry.dynamic = true;
        if(this.animations && this.animations.idle){
            this.setAnimationState("idle", 0, 0);
        }
        var texture = THREE.ImageUtils.loadTexture( "./images/"+name+".png" );
        texture.minFilter = THREE.LinearFilter;
        texture.maxFilter = THREE.LinearFilter;
        var material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
        material.side = THREE.doubleSided;
        this.object = new THREE.Mesh(this.geometry, material);
        this.object.rotation.x = Math.PI;

        this.object.position.z = 10;

        this.position = new THREE.Vector2(1,1);
        this.velocity = new THREE.Vector2(0,0);

        this.halfSize = new THREE.Vector2(13/32 /2, 22/32 /2);
        this.direction = "right";
    }

    Actor.prototype.setAnimationState = function(name, frame, time){
        if(typeof name == "undefined") name = this.currentAnimation;
        if(typeof frame == "undefined") frame = this.currentFrame;
        if(typeof time == "undefined") time = this.currentTime;

        while(this.animations[name][frame].t < time){
            time -= this.animations[name][frame].t;
            frame = (frame+1) % this.animations[name].length;
            if(this.animations[name][frame].next){
                name = this.animations[name][frame].next;
                frame = 0;
            }
        }
        var f = this.animations[name][frame];

        var x0 = f.x / this.imageSize.width;
        var x1 = (f.x+this.imageSize.tileWidth) / this.imageSize.width;
        var y1 = f.y / this.imageSize.height;
        var y0 = (f.y+this.imageSize.tileHeight) / this.imageSize.height;
        y0 = 1-y0;
        y1 = 1-y1;

        if(this.direction == "left") {
            var t = x1;
            x1 = x0;
            x0 = t;
        }
        this.geometry.faceVertexUvs[0][0][0].set(x0, y1);
        this.geometry.faceVertexUvs[0][0][1].set(x0, y0);
        this.geometry.faceVertexUvs[0][0][2].set(x1, y1);
        this.geometry.faceVertexUvs[0][1][0].set(x0, y0);
        this.geometry.faceVertexUvs[0][1][1].set(x1, y0);
        this.geometry.faceVertexUvs[0][1][2].set(x1, y1);

        this.currentAnimation = name;
        this.currentFrame = frame;
        this.currentTime = time;

        this.geometry.uvsNeedUpdate = true;
    };

    Actor.prototype.land = function(){
        if(this.currentAnimation != "idle") {
            this.setAnimationState("idle", 1, 0);
        };
    };

    Actor.prototype.lookLeft = function(){
        if(this.direction == "right"){
            this.direction = "left";
            this.setAnimationState();
        }
    };

    Actor.prototype.lookRight = function(){
        if(this.direction == "left"){
            this.direction = "right";
            this.setAnimationState();
        }
    };

    //Recycling of objects, works because javascript functions are never interrupted
    var movement = new THREE.Vector2(0,0); //recycled, reflects change of position in one frame
    var acc = new THREE.Vector2(0,0); //recycled, reflects change of velocity in one frame
    Actor.prototype.update = function(delta){
        if(this.currentAnimation) {
            this.currentTime += delta;
            this.setAnimationState();
        }

        var d = delta/1000;

        movement.copy(this.velocity);
        movement.multiplyScalar(d);

        acc.copy(this.game.accelerationAt(this.position));
        acc.multiplyScalar(d);
        this.velocity.add(acc);

        acc.multiplyScalar(d/2);
        movement.add(acc);

        this.position.add(movement);

        if(movement.x > 0 ){
            this.lookRight();
        } else if(movement.x < 0){
            this.lookLeft();
        }

        var collisions = this.game.getCollisions(this);
        var correction = new THREE.Vector2();

        for (var i = 0; i < collisions.length; i++) {
            var coll = collisions[i];
            if(Math.abs(coll.x) < Math.abs(coll.y)){
                if(correction.x == 0 || Math.abs(correction.x) > Math.abs(coll.x)){
                    correction.x = coll.x;
                    if(this.velocity.x * coll.x > 0) {
                        this.velocity.x = 0;
                    }
                }

            } else {
                if(correction.y == 0 || Math.abs(correction.y) > Math.abs(coll.y)){
                    correction.y = coll.y;
                    if(this.velocity.y * coll.y > 0) {
                        this.velocity.y = 0;
                    }
                    if(coll.y > 0){
                        this.land();
                    }
                }

            }
        }

        if((this.velocity.y != 0 || correction.y < 0) && this.currentAnimation != "air" && this.currentAnimation != "jump"){
            this.setAnimationState("air",0,0);
        }

        this.position.sub(correction);

        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
    };

    return Actor;
});