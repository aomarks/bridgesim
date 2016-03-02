///<reference path="util.ts" />
///<reference path="global.ts" />

// TODO: Key codes are kind of a mess. This should work for Chrome at least.
// See http://unixpapa.com/js/key.html

const KEY_ARROW_L = 37;
const KEY_ARROW_U = 38;
const KEY_ARROW_R = 39;
const KEY_ARROW_D = 40;
const KEY_K = 'K'.charCodeAt(0);
const KEY_L = 'L'.charCodeAt(0);
const KEY_O = 'O'.charCodeAt(0);
const KEY_P = 'P'.charCodeAt(0);
const KEY_S = 'S'.charCodeAt(0);
const KEY_W = 'W'.charCodeAt(0);

let keyBindings = {
  [KEY_ARROW_L]: turnLeft,
  [KEY_ARROW_R]: turnRight,
  [KEY_ARROW_U]: thrustUp,
  [KEY_ARROW_D]: thrustDown,
  [KEY_O]: prevShip,
  [KEY_P]: nextShip,
  [KEY_K]: prevSubsystem,
  [KEY_L]: nextSubsystem,
  [KEY_W]: powerUp,
  [KEY_S]: powerDown,
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
  keyPressed[event.keyCode] = 0;
  console.log('key down', event.keyCode);
}

function onKeyup(event) {
  delete keyPressed[event.keyCode];
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
