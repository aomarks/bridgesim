'use strict';

const GRID_SIZE = 61;
const TILE_PX = 10;
const BLIP_PX = 2;
let canvas, ctx;

let ships = [
  {name: 'A', x: 0, y: 0},
  {name: 'B', x: 59, y: 59},
  {name: 'C', x: 20, y: 8},
];

function start() {
  canvas = document.getElementById('grid');
  ctx = canvas.getContext('2d');

  draw();
}

function draw() {
  drawGrid();
  drawShips();
}

function drawGrid() {
  ctx.beginPath();
  for (var i = 0; i < GRID_SIZE; i++) {
    ctx.moveTo(i * TILE_PX + .5, .5);
    ctx.lineTo(i * TILE_PX + .5, 600+.5);
    ctx.moveTo(0 + .5, i * TILE_PX+.5);
    ctx.lineTo(600 + .5, i * TILE_PX+.5);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#8BC34A';
  ctx.stroke();
}

function drawShips() {
  for (let ship of ships) {
    ctx.beginPath();
    console.log(ship);
    ctx.arc(ship.x*TILE_PX + TILE_PX/2 + .5,
            ship.y*TILE_PX + TILE_PX/2 + .5,
            BLIP_PX, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
  }
}
