'use strict';

const GRID_SIZE = 61;
const TILE_PX = 10;
const BLIP_PX = 2;
const HP = 0.5;  // half pixel

let ships = [];
let ship, shipIdx;

function init() {
  ships = [
    new Ship('P28', 30, 30, 0),
    new Ship('A19', 18, 2, 18),
    new Ship('S93', 20, 8, 37),
  ];
  ship = ships[0];
  shipIdx = 0;

  initInput();
  initMap();
  initNav();
  initThrust();
  initPower();

  requestAnimationFrame(frame);
}

function frame() {
  inputs();
  tick();
  draw();
  requestAnimationFrame(frame);
}

function tick() {
  for (let ship of ships) {
    ship.tick();
  }
}

function draw() {
  drawMap();
  drawNav();
  drawThrust();
  drawPower();
}
