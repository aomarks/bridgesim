'use strict';

const GRID_SIZE = 61;
const TILE_PX = 10;
const BLIP_PX = 2;

let ships = [
  {name: 'P28', x: 0, y: 0, heading: 0},
  {name: 'A19', x: 38, y: 18},
  {name: 'S93', x: 20, y: 8},
];

function init() {
  initInput();
  initMap();
  initNav();
  
  requestAnimationFrame(frame);
}

function frame() {
  inputs();
  draw();
  requestAnimationFrame(frame);
}

function draw() {
  drawMap();
  drawNav();
}
