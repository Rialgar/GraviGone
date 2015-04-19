/**
 * Created by Rialgar on 2015-04-19.
 */
define(["lib/three", "Sprite"], function(THREE, Sprite){
    var superclass = Sprite;

    var sounds = {
        on: [
            new Audio("./sounds/zoneOn.wav"),
            new Audio("./sounds/zoneOn.wav"),
            new Audio("./sounds/zoneOn.wav"),
            new Audio("./sounds/zoneOn.wav"),
            new Audio("./sounds/zoneOn.wav"),
            new Audio("./sounds/zoneOn.wav")
        ],
        off: [
            new Audio("./sounds/zoneOff.wav"),
            new Audio("./sounds/zoneOff.wav"),
            new Audio("./sounds/zoneOff.wav"),
            new Audio("./sounds/zoneOff.wav"),
            new Audio("./sounds/zoneOff.wav"),
            new Audio("./sounds/zoneOff.wav")
        ]
    };

    for (i = 0; i < sounds.on.length; i++) {
        sounds.on[i].volume = 0.4;
    }
    for (i = 0; i < sounds.off.length; i++) {
        sounds.off[i].volume = 0.4;
    }

    function GraviGoneZone(position, game) {
        superclass.call(this, "GravityGoneZone");

        this.game = game;

        this.position = position;
        this.object.position.x = position.x;
        this.object.position.y = position.y;

        this.object.scale.set(0, 0, 1);
        this.time = 0;

        this.times = {
            grow: 300,
            stay: 4700,
            shrink: 5000
        };

        this.startedShrink = false;
        var sound = sounds.on.shift();
        sound.play();
        sounds.on.push(sound);
    }
    GraviGoneZone.prototype = Object.create(superclass.prototype);

    GraviGoneZone.prototype.update = function(delta){
        superclass.prototype.update.call(this, delta);
        this.time += delta;
        var t = 0;
        if(this.time <= this.times.grow){
            t = this.time/this.times.grow;
        } else if(this.time <= this.times.stay) {
            t = 1;
        } else if(this.time <= this.times.shrink) {
            if(!this.startedShrink){
                this.startedShrink = true;
                var sound = sounds.off.shift();
                sound.play();
                sounds.off.push(sound);
            }
            t = (this.times.shrink-this.time)/(this.times.shrink - this.times.stay);
        } else {
            this.needsRemoval = true;
        }
        this.object.scale.set(t, t, 1);
    };

    GraviGoneZone.prototype.contains = function(position){
        var dSq = this.position.distanceToSquared(position);
        return dSq < 4;
    };

    GraviGoneZone.prototype.collect = function(){
        this.collected = true;
        var d = this.times.shrink-this.times.stay;
        this.times.stay = Math.max(this.times.grow, Math.min(this.times.stay, this.time));
        this.times.shrink = this.times.stay + d;
    };

    return GraviGoneZone;
});
