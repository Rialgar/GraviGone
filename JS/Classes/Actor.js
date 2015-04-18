/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three"], function(THREE){
    function Actor(name, game){
        this.game = game;

        var geometry = new THREE.PlaneGeometry(13/32, 22/32);
        var texture = THREE.ImageUtils.loadTexture( "./images/"+name+".png" );
        texture.minFilter = THREE.LinearFilter;
        texture.maxFilter = THREE.LinearFilter;
        var material = new THREE.MeshBasicMaterial({map: texture});
        this.object = new THREE.Mesh(geometry, material);
        this.object.rotation.x = Math.PI;

        this.object.position.z = 10;

        this.position = new THREE.Vector2(1,1);
        this.velocity = new THREE.Vector2(0,0);

        this.halfSize = new THREE.Vector2(13/32 /2, 22/32 /2);
    }

    //Recycling of objects, works because javascript functions are never interrupted
    var movement = new THREE.Vector2(0,0); //recycled, reflects change of position in one frame
    var acc = new THREE.Vector2(0,0); //recycled, reflects change of velocity in one frame
    Actor.prototype.update = function(delta){
        var d = delta/1000;

        movement.copy(this.velocity);
        movement.multiplyScalar(d);

        acc.copy(this.game.accelerationAt(this.position));
        acc.multiplyScalar(d);
        this.velocity.add(acc);

        acc.multiplyScalar(d/2);
        movement.add(acc);

        this.position.add(movement);

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
                }

            }
        }

        this.position.sub(correction);

        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
    };

    return Actor;
});