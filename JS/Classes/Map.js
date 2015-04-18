/**
 * Created by Rialgar on 2015-04-18.
 */
define(["lib/three"], function(THREE) {
    function Map() {
        this.width = 0;
        this.height = 0;
    }

    Map.prototype.getCollisions = function(collidable){
        var min = collidable.position.clone().sub(collidable.halfSize);
        var max = collidable.position.clone().add(collidable.halfSize);

        var out = [];
        for(var x = Math.max(0, Math.round(min.x)); x < Math.min(this.width-1, max.x+0.5); x++){
            for(var y =Math.max(0, Math.round(min.y)); y < Math.min(this.height, max.y+0.5); y++){
                if(this.walls[y][x]){
                    var collision = new THREE.Vector2(2, 2);
                    var negX = -Infinity;
                    var posX = Infinity;
                    var foundX = false;
                    if(x+1 < this.width && !this.walls[y][x+1]){
                        negX = min.x - (x+0.5);
                        foundX = true;
                    }
                    if(x-1 >= 0 && !this.walls[y][x-1]){
                        posX = max.x - (x-0.5);
                        foundX = true;
                    }
                    if(foundX){
                        if(-negX < posX){
                            collision.x = negX;
                        }else{
                            collision.x = posX;
                        }
                    }
                    var negY = -Infinity;
                    var posY = Infinity;
                    var foundY = false;
                    if(y+1 < this.height && !this.walls[y+1][x]){
                        negY = min.y - (y+0.5);
                        foundY = true;
                    }
                    if(y-1 >= 0 && !this.walls[y-1][x]){
                        posY = max.y - (y-0.5); //positive
                        foundY = true;
                    }
                    if(foundY){
                        if(-negY < posY){
                            collision.y = negY;
                        }else{
                            collision.y = posY;
                        }
                    }
                    out.push(collision);
                }
            }
        }

        return out;
    };

    var collisionIds = [1];
    Map.prototype.loadData = function(data){
        this.walls = [];
        this.width = data.width;
        this.height = data.height;

        var parent = this.object && this.object.parent;
        if(parent){
            parent.remove(this.object);
        }

        var geometry = new THREE.PlaneGeometry(data.width, data.height, data.width, data.height);
        geometry.faceVertexUvs[0] = [];

        var offset = 0;
        for ( var y = 0; y < data.height; y++ ) {
            this.walls[y] = [];
            for ( var x = 0; x < data.width; x++ ) {

                var tile = data.layers[0].tiles[y][x];
                var tileSet = tile.tileSet;
                var image = tileSet.image;

                var ix = tile.imageCoordinates.x;
                var iy = tile.imageCoordinates.y;


                var x0 = ix * (tileSet.tileWidth + tileSet.spacing) + tileSet.margin;
                var x1 = x0 + tileSet.tileWidth;
                var y0 = iy * (tileSet.tileHeight + tileSet.spacing) + tileSet.margin;
                var y1 = y0 + tileSet.tileHeight;
                y0 = image.height - y0;
                y1 = image.height - y1;

                var uv =  [
                    new THREE.Vector2(x0/image.width, y0/image.height),
                    new THREE.Vector2(x0/image.width, y1/image.height),
                    new THREE.Vector2(x1/image.width, y1/image.height),
                    new THREE.Vector2(x1/image.width, y0/image.height)
                ];

                geometry.faceVertexUvs[0][offset] = [uv[0], uv[1], uv[3]];
                geometry.faceVertexUvs[0][offset+1] = [uv[1], uv[2], uv[3]];

                offset += 2;

                this.walls[y][x] = collisionIds.indexOf(tile.gid-1) >= 0;
            }
        }

        var src = data.tileSets[0].image.source;
        src = src.substring(1, src.length);
        var texture = THREE.ImageUtils.loadTexture( src );
        texture.minFilter = THREE.LinearFilter;
        texture.maxFilter = THREE.LinearFilter;
        var material = new THREE.MeshBasicMaterial({map: texture});
        this.object = new THREE.Mesh(geometry, material);
        this.object.rotation.x = Math.PI;
        this.object.position.x = 7.5;
        this.object.position.y = 4.5;

        if(parent){
            parent.add(this.object);
        }
    };

    Map.prototype.load = function(mapName){
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "./maps/"+mapName+".tmx", false);
        xhttp.overrideMimeType("text/xml");
        xhttp.send();
        var data = readTiledDOM(xhttp.responseXML);
        this.loadData(data);
    };

    function readTiledDOM(dom){
        console.assert(dom.documentElement.tagName == "map");
        var out = {
            width: parseInt(dom.documentElement.getAttribute("width")),
            height: parseInt(dom.documentElement.getAttribute("height")),
            tileWidth: parseInt(dom.documentElement.getAttribute("tilewidth")),
            tileHeight: parseInt(dom.documentElement.getAttribute("tileheight")),
            tileSets: [],
            layers: []
        };
        var tileSetElements = dom.getElementsByTagName("tileset");
        for (var i = 0; i < tileSetElements.length; i++) {
            var tsElement = tileSetElements[i];
            var tileSet = {
                name: tsElement.getAttribute("name"),
                firstGid:  parseInt(tsElement.getAttribute("firstgid")),
                tileWidth: parseInt(tsElement.getAttribute("tilewidth")),
                tileHeight: parseInt(tsElement.getAttribute("tileheight")),
                spacing: parseInt(tsElement.getAttribute("spacing")),
                margin: parseInt(tsElement.getAttribute("margin"))
            };
            var iElement = tsElement.getElementsByTagName("image")[0];
            tileSet.image = {
                source: iElement.getAttribute("source"),
                width: parseInt(iElement.getAttribute("width")),
                height: parseInt(iElement.getAttribute("height"))
            };
            tileSet.width = (tileSet.image.width-2*tileSet.margin + tileSet.spacing) /
                            (tileSet.tileWidth + tileSet.spacing);
            tileSet.height = (tileSet.image.height-2*tileSet.margin + tileSet.spacing) /
                             (tileSet.tileHeight + tileSet.spacing);
            out.tileSets.push(tileSet);
        }

        function getTileSetForGid(gid){
            var last = null;
            for (var i = 0; i < out.tileSets.length; i++) {
                var next = out.tileSets[i];
                if(next.firstGid > gid){
                    return last;
                }
                last = next;
            }
            return last;
        }

        var layerElements = dom.getElementsByTagName("layer");
        for (i = 0; i < layerElements.length; i++) {
            var lElement = layerElements[i];
            var layer = {
                name: lElement.getAttribute("name"),
                width: parseInt(lElement.getAttribute("width")),
                height: parseInt(lElement.getAttribute("height")),
                tiles: []
            };
            var tileElements = lElement.getElementsByTagName("tile");
            for (j = 0; j < tileElements.length; j++) {
                var tElement = tileElements[j];
                var tile = {
                    gid: parseInt(tElement.getAttribute("gid"))
                };

                tile.tileSet = getTileSetForGid(tile.gid);
                tile.imageCoordinates = {};
                tile.imageCoordinates.x = (tile.gid - tile.tileSet.firstGid) % tile.tileSet.width;
                tile.imageCoordinates.y = (tile.gid - tile.tileSet.firstGid - tile.imageCoordinates.x) / tile.tileSet.width;

                var x = j % layer.width;
                var y = (j-x) / layer.width;
                if(!layer.tiles[y]){
                    layer.tiles[y] = [];
                }
                layer.tiles[y][x] = tile;
            }
            out.layers.push(layer);
        }

        return out;
    }

    return Map;
});