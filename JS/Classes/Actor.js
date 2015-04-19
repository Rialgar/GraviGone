/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three", "Sprite"], function(THREE, Sprite){
    var superclass = Sprite;

    function Actor(name, game){
        superclass.call(this, name);

        this.game = game;

        this.object.position.z = 10;

        this.position = new THREE.Vector2(1,1);
        this.velocity = new THREE.Vector2(0,0);

        this.halfSize = new THREE.Vector2(13/32 /2, 22/32 /2);
        this.direction = "right";
    }

    Actor.prototype = Object.create(superclass.prototype);

    Actor.prototype.land = function(){
        if(this.currentAnimation != "idle") {
            this.setAnimationState("idle", 1, 0);
        }
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
        superclass.prototype.update.call(this, delta);
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

        if((correction.y <= 0) && this.currentAnimation != "air" && this.currentAnimation != "jump"){
            this.setAnimationState("air",0,0);
        }

        this.position.sub(correction);

        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
    };

    return Actor;
});