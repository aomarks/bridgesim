'use strict';

let keyBindings = {
  'ArrowLeft': turnLeft,
  'ArrowRight': turnRight,
  'ArrowUp': thrustUp,
  'ArrowDown': thrustDown,
  'BracketLeft': prevShip,
  'BracketRight': nextShip,
  'Numpad4': prevSubsystem,
  'Numpad6': nextSubsystem,
  'Numpad8': powerUp,
  'Numpad5': powerDown,
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
  console.log('key down', event.code);
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
  ship.turnLeft();
}

function turnRight() {
  ship.turnRight();
}

function thrustUp() {
  ship.thrustUp();
}

function thrustDown(ticks) {
  ship.thrustDown();
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

function nextSubsystem(tick) {
  if (tick > 0) {
    return;
  }
  if (ship.curSubsystem == ship.subsystems.length - 1) {
    ship.curSubsystem = 0;
  } else {
    ship.curSubsystem++;
  }
}

function prevSubsystem(tick) {
  if (tick > 0) {
    return;
  }
  if (ship.curSubsystem == 0) {
    ship.curSubsystem = ship.subsystems.length - 1;
  } else {
    ship.curSubsystem--;
  }
}

function powerUp(tick) {
  ship.powerUp();
}

function powerDown(tick) {
  ship.powerDown();
}
