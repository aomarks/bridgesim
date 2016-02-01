'use strict';

let keyBindings = {
  'ArrowLeft': turnLeft,
  'ArrowRight': turnRight,
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
  ships[0].heading -= 2;
}

function turnRight() {
  ships[0].heading += 2;
}
