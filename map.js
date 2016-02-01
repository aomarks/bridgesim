'use strict';

let mapCan, mapCtx;

function initMap() {
  mapCan = document.getElementById('map')
  mapCtx = mapCan.getContext('2d');
}

function drawMap() {
  mapCtx.clearRect(0, 0, mapCan.width, mapCan.height);
  
  drawGrid();
  drawBlips();
}

function drawGrid() {  
  mapCtx.beginPath();
  for (var i = 0; i < GRID_SIZE; i++) {
    mapCtx.moveTo(i * TILE_PX + .5, .5);
    mapCtx.lineTo(i * TILE_PX + .5, 600+.5);
    mapCtx.moveTo(0 + .5, i * TILE_PX+.5);
    mapCtx.lineTo(600 + .5, i * TILE_PX+.5);
  }
  mapCtx.lineWidth = 1;
  mapCtx.strokeStyle = '#8BC34A';
  mapCtx.stroke();
}

function drawBlips() {
  for (let ship of ships) {
    mapCtx.beginPath();
    let x = ship.x * TILE_PX + TILE_PX / 2 + .5;
    let y = ship.y * TILE_PX + TILE_PX / 2 + .5;
    mapCtx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
    mapCtx.fillStyle = '#FF0000';
    mapCtx.fill();

    mapCtx.beginPath();
    mapCtx.fillStyle = '#fff';
    mapCtx.font = '20px monospace';
    mapCtx.strokeStyle = '#000';
    mapCtx.lineWidth = 3;
    mapCtx.strokeText(ship.name, x + 10, y + 5);
    mapCtx.fillText(ship.name, x + 10, y + 5);
  }
}
