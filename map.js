'use strict';

let mapCan, mapCtx;

function initMap() {
  mapCan = document.getElementById('map');
  mapCtx = mapCan.getContext('2d');
}

function drawMap() {
  mapCtx.clearRect(0, 0, mapCan.width, mapCan.height);

  drawGrid();
  drawBlips();
}

function drawGrid() {
  mapCtx.beginPath();
  for (let i = 0; i < GRID_SIZE; i++) {
    mapCtx.moveTo(i * TILE_PX + HP, HP);
    mapCtx.lineTo(i * TILE_PX + HP, 600 + HP);
    mapCtx.moveTo(0 + HP, i * TILE_PX + HP);
    mapCtx.lineTo(600 + HP, i * TILE_PX + HP);
  }
  mapCtx.lineWidth = 1;
  mapCtx.strokeStyle = '#8BC34A';
  mapCtx.stroke();
}

function drawBlips() {
  for (let s of ships) {
    mapCtx.beginPath();
    let x = s.x * TILE_PX + TILE_PX / 2 + HP;
    let y = s.y * TILE_PX + TILE_PX / 2 + HP;
    mapCtx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
    if (ship === s) {
      mapCtx.fillStyle = '#00C2D8';
    } else {
      mapCtx.fillStyle = '#FF0000';
    }
    mapCtx.fill();

    mapCtx.beginPath();
    mapCtx.fillStyle = '#fff';
    mapCtx.font = '20px monospace';
    mapCtx.strokeStyle = '#000';
    mapCtx.lineWidth = 3;
    mapCtx.strokeText(s.name, x + 10, y + 5);
    mapCtx.fillText(s.name, x + 10, y + 5);
  }
}
