define(["lib/three", "Sprite"], function(THREE, Sprite) {
    var superclass = Sprite;

    var definitions = {
        "Ammo": {
            onCollect: function(game){
                game.addAvailableBullet();
            }
        }
    };

    var sounds = [
        new Audio("./sounds/pickup.wav"),
        new Audio("./sounds/pickup.wav"),
        new Audio("./sounds/pickup.wav"),
        new Audio("./sounds/pickup.wav"),
        new Audio("./sounds/pickup.wav"),
        new Audio("./sounds/pickup.wav")
    ];

    function Collectible(name, position, game){
        superclass.call(this,name);

        this.def = definitions[name];
        this.game = game;

        this.position = position;

        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;

        this.time = 0;
        this.bob = {
            height: 0.1,
            time: 1300
        };

        this.halfSize = new THREE.Vector2(7/32 /2, 13/32 /2);
    }

    Collectible.prototype = Object.create(superclass.prototype);

    Collectible.prototype.checkCollission = function(collidable){
        var otherMin = collidable.position.clone().sub(collidable.halfSize);
        var otherMax = collidable.position.clone().add(collidable.halfSize);
        var ownMin = this.position.clone().sub(this.halfSize);
        var ownMax = this.position.clone().add(this.halfSize);
        if( ownMin.x < otherMax.x &&
            ownMax.x > otherMin.x &&
            ownMin.y < otherMax.y &&
            ownMax.y > otherMin.y)
        {
            this.collect();
        }
    };

    Collectible.prototype.collect = function(){
        this.def.onCollect(this.game);
        this.collected = true;
        var sound = sounds.shift();
        sound.play();
        sounds.push(sound);
    };

    Collectible.prototype.update = function(delta){
        superclass.prototype.update.call(this, delta);
        this.time = (this.time+delta) % this.bob.time;
        var h = this.bob.height * (Math.sin(this.time/this.bob.time * 2 * Math.PI));
        this.object.position.y = this.position.y + h;
    };

    return Collectible;
});