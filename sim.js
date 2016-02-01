'use strict';

const GRID_SIZE = 61;
const TILE_PX = 10;
const BLIP_PX = 2;

let mapCan, mapCtx;
let navCan, navCtx;

let ships = [
  {name: 'A', x: 0, y: 0, heading: 0},
  {name: 'B', x: 59, y: 59},
  {name: 'C', x: 20, y: 8},
];

function start() {
  mapCan = document.getElementById('map')
  mapCtx = mapCan.getContext('2d');
  navCan = document.getElementById('nav');
  navCtx = navCan.getContext('2d');

  addEventListener('keydown', onKeydown);
  addEventListener('keyup', onKeyup);
  
  requestAnimationFrame(frame);
}

let keyBindings = {
  'ArrowLeft': turnLeft,
  'ArrowRight': turnRight,
};

let keyPressed = {};

function onKeydown(event) {
  if (event.repeat) {
    return;
  }
  keyPressed[event.code] = true;
}

function onKeyup(event) {
  delete keyPressed[event.code];
}

function inputs() {
  for (let key in keyPressed) {
    let fn = keyBindings[key];
    if (fn) {
      fn();
    }
  }
}

function turnLeft() {
  ships[0].heading += 2;
}

function turnRight() {
  ships[0].heading -= 2;
}

function frame() {
  inputs();
  draw();
  requestAnimationFrame(frame);
}

function draw() {
  drawGrid();
  drawShips();
  drawNav();
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

function drawShips() {
  for (let ship of ships) {
    mapCtx.beginPath();
    mapCtx.arc(ship.x*TILE_PX + TILE_PX/2 + .5,
            ship.y*TILE_PX + TILE_PX/2 + .5,
            BLIP_PX, 0, 2 * Math.PI);
    mapCtx.fillStyle = '#FF0000';
    mapCtx.fill();
  }
}

function drawNav() {
  navCtx.clearRect(0, 0, navCan.width, navCan.height);
  
  let ship = ships[0];
  let radius = 100;
  let centerX = 100;
  let centerY = 100;
  
  navCtx.beginPath();
  navCtx.moveTo(.5 + centerX, .5 + centerY);
  navCtx.lineWidth = 1;
  navCtx.lineTo(
      .5 + (Math.cos(radians(ship.heading)) * radius*.75 + centerX),
      .5 + (Math.sin(radians(ship.heading)) * radius*.75 + centerY)
  )
  navCtx.strokeStyle = '#00ff00';
  navCtx.stroke();

  navCtx.beginPath();
  navCtx.arc(radius + .5, radius + .5,
             radius-5, 0, 2 * Math.PI);
  navCtx.lineWidth = 2;
  navCtx.strokeStyle = '#ffffff';
  navCtx.stroke();
}

function radians(degrees) {
  return (degrees * Math.PI) / 180;
}
