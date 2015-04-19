/**
 * Created by Rialgar on 2015-04-19.
 */
define(["lib/three"], function(THREE){
    var definitions = {
        "Player":{
            size: {x:13/32, y:22/32},
            imageSize: {
                width: 30,
                height: 48,
                tileWidth: 13,
                tileHeight: 22
            },
            animations: {
                idle: [
                    {x:1, y:1, t:250},
                    {x:16, y:1, t:250}
                ],
                jump: [
                    {x:16, y:25, t:250},
                    {next: "air"}
                ],
                air: [
                    {x:1, y:25, t:500}
                ]
            },
            texture: THREE.ImageUtils.loadTexture( "./images/Player.png" )
        },
        "Bullet":{
            size: {x:13/32, y:13/32},
            imageSize: {
                width: 30,
                height: 30,
                tileWidth: 13,
                tileHeight: 13
            },
            animations: {
                idle: [
                    {x:1, y:1, t:500}
                ],
                explosion: [
                    {x:16, y:1, t:500},
                    {next: "scorch"}
                ],
                scorch: [
                    {x:16, y:16, t:500},
                ]
            },
            texture: THREE.ImageUtils.loadTexture( "./images/Bullet.png" )
        },
        "GravityGoneZone":{
            size: {x:128/32, y:128/32},
            imageSize: {
                width: 130,
                height: 130,
                tileWidth: 128,
                tileHeight: 128
            },
            animations: {
                idle: [
                    {x:1, y:1, t:500}
                ]
            },
            texture: THREE.ImageUtils.loadTexture( "./images/GraviGoneZone.png" )
        }

    };
    function Sprite(name){
        var def = definitions[name];
        if(!def){
            console.error("No sprite definition for: " + name);
        }
        this.animations = def.animations;
        this.imageSize = def.imageSize;
        this.geometry = new THREE.PlaneGeometry(def.size.x, def.size.y);
        this.geometry.dynamic = true;
        this.setAnimationState("idle", 0, 0);

        var texture = def.texture;
        texture.minFilter = THREE.LinearFilter;
        texture.maxFilter = THREE.LinearFilter;
        var material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
        this.object = new THREE.Mesh(this.geometry, material);
        this.object.rotation.x = Math.PI;
    }

    Sprite.prototype.setAnimationState = function(name, frame, time){
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

    Sprite.prototype.update = function(delta){
        this.currentTime += delta;
        this.setAnimationState();
    };

    return Sprite;
});