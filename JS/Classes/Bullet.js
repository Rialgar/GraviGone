/**
 * Created by Rialgar on 2015-04-19.
 */
define(["lib/three", "Sprite"], function(THREE, Sprite){
    var superclass = Sprite;
    function Bullet(position, velocity, game){
        superclass.call(this, "Bullet");

        this.object.position.z = 20;

        this.object.rotation.z = -Math.atan2(velocity.y, velocity.x);

        this.position = position;
        this.velocity = velocity;
        this.game = game;

        this.halfSize = new THREE.Vector2(11/32 /2, 11/32 /2);
    }

    Bullet.prototype = Object.create(superclass.prototype);

    Bullet.prototype.explode = function(){
        this.setAnimationState("explosion", 0 , 0);
        this.game.addGraviGoneZone(this.position.clone());
    };

    var movement = new THREE.Vector2();
    Bullet.prototype.update = function(delta){
        superclass.prototype.update.call(this, delta);

        movement.copy(this.velocity);
        movement.multiplyScalar(delta/1000);
        this.position.add(movement);

        var collisions = this.game.getCollisions(this);
        var correction = new THREE.Vector2();

        for (var i = 0; i < collisions.length; i++) {
            var coll = collisions[i];
            if(Math.abs(coll.x) < Math.abs(coll.y)){
                if(correction.x == 0 || Math.abs(correction.x) > Math.abs(coll.x)){
                    correction.x = coll.x;
                }
            } else {
                if(correction.y == 0 || Math.abs(correction.y) > Math.abs(coll.y)){
                    correction.y = coll.y;
                }
            }
        }

        if(correction.lengthSq() != 0){
            this.velocity.set(0,0);
            this.object.rotation.z = -Math.atan2(correction.y, correction.x);
            this.explode();
            this.position.sub(correction);
        }

        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;

        if(this.currentAnimation == "scorch"){
            this.game.stopUpdatingBullet(this);
        }
    };

    return Bullet;
});