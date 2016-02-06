'use strict';

let keyBindings = {
  'ArrowLeft': turnLeft,
  'ArrowRight': turnRight,
  'ArrowUp': thrustUp,
  'ArrowDown': thrustDown,
  'BracketLeft': prevShip,
  'BracketRight': nextShip,
};

let keyPressed = {};

function initInput() {
  addEventListener('keydown', onKeydown);
  addEventListener('keyup', onKeyup);
}

function onKeydown(event) {
  if (event.repeat) {
    return;
  }
  keyPressed[event.code] = 0;
}

function onKeyup(event) {
  delete keyPressed[event.code];
}

function inputs() {
  for (let key in keyPressed) {
    let fn = keyBindings[key];
    if (fn) {
      fn(keyPressed[key]);
    }
    keyPressed[key]++;
  }
}

function turnLeft() {
  ship.heading -= 2;
}

function turnRight() {
  ship.heading += 2;
}

function thrustUp() {
  ship.thrust += .01;
  if (ship.thrust > 1) {
    ship.thrust = 1;
  }
}

function thrustDown(ticks) {
  ship.thrust -= .01;
  if (ship.thrust < 0) {
    ship.thrust = 0;
  }
}

function nextShip(tick) {
  if (tick > 0) {
    return;
  }
  if (shipIdx == ships.length - 1) {
    shipIdx = 0;
  } else {
    shipIdx++;
  }
  ship = ships[shipIdx]
}

function prevShip(tick) {
  if (tick > 0) {
    return;
  }
  if (shipIdx == 0) {
    shipIdx = ships.length - 1;
  } else {
    shipIdx--;
  }
  ship = ships[shipIdx]
}
