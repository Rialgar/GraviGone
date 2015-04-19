/**
 * Created by Rialgar on 2015-04-19.
 */
define(["lib/three", "Sprite"], function(THREE, Sprite){
    var superclass = Sprite;
    function GraviGoneZone(position, game) {
        superclass.call(this, "GravityGoneZone");

        this.game = game;

        this.position = position;
        this.object.position.x = position.x;
        this.object.position.y = position.y;

        this.object.scale.set(0, 0, 1);
        this.time = 0;
    }
    GraviGoneZone.prototype = Object.create(superclass.prototype);

    GraviGoneZone.prototype.update = function(delta){
        superclass.prototype.update.call(this, delta);
        this.time += delta;
        if(this.time <= 300){
            this.object.scale.set(this.time/300, this.time/300, 1);
        } else if(this.time <= 4700) {
            this.object.scale.set(1, 1, 1);
        } else if(this.time <= 5000) {
            this.object.scale.set((5000-this.time)/300, (5000-this.time)/300, 1);
        } else {
            this.game.removeGraviGoneZone(this);
        }
    };

    GraviGoneZone.prototype.contains = function(position){
        var dSq = this.position.distanceToSquared(position);
        return dSq < 4;
    };

    return GraviGoneZone;
});
