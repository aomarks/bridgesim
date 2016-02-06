'use strict';

let keyBindings = {
  'ArrowLeft': turnLeft,
  'ArrowRight': turnRight,
  'ArrowUp': thrustUp,
  'ArrowDown': thrustDown,
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

function thrustDown() {
  ship.thrust -= .01;
  if (ship.thrust < 0) {
    ship.thrust = 0;
  }
}
