'use strict';

const GRID_SIZE = 61;
const TILE_PX = 10;
const BLIP_PX = 2;

let ships = [];
let ship;

function init() {
  ships = [
    new Ship('P28', 0, 0, 0),
    new Ship('A19', 18, 2, 18),
    new Ship('S93', 20, 8, 37),
  ];
  ship = ships[0];

  initInput();
  initMap();
  initNav();
  initThrust();
  
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
  drawThrust();
}
