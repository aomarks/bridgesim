'use strict';

const GRID_SIZE = 61;
const TILE_PX = 10;
const BLIP_PX = 2;

let mapCan, mapCtx;
let navCan, navCtx;

let ships = [
  {name: 'P28', x: 0, y: 0, heading: 0},
  {name: 'A19', x: 38, y: 18},
  {name: 'S93', x: 20, y: 8},
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
  ships[0].heading -= 2;
}

function turnRight() {
  ships[0].heading += 2;
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
