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

let keyBindings: {[key: number]: (tick: number) => void} = {
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

let keyPressed: {[key: number]: number} = {};

function initInput(): void {
  addEventListener('keydown', onKeydown);
  addEventListener('keyup', onKeyup);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.repeat) {
    return;
  }
  keyPressed[event.keyCode] = 0;
  console.log('key down', event.keyCode);
}

function onKeyup(event: KeyboardEvent): void {
  delete keyPressed[event.keyCode];
}

function inputs(): void {
  for (let key in keyPressed) {
    let fn = keyBindings[key];
    if (fn) {
      fn(keyPressed[key]);
    }
    keyPressed[key]++;
  }
}

function turnLeft(): void {
  ship.turnLeft();
}

function turnRight(): void {
  ship.turnRight();
}

function thrustUp(): void {
  ship.thrustUp();
}

function thrustDown(): void {
  ship.thrustDown();
}

function nextShip(tick: number): void {
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

function prevShip(tick: number): void {
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

function nextSubsystem(tick: number): void {
  if (tick > 0) {
    return;
  }
  if (ship.curSubsystem == ship.subsystems.length - 1) {
    ship.curSubsystem = 0;
  } else {
    ship.curSubsystem++;
  }
}

function prevSubsystem(tick: number): void {
  if (tick > 0) {
    return;
  }
  if (ship.curSubsystem == 0) {
    ship.curSubsystem = ship.subsystems.length - 1;
  } else {
    ship.curSubsystem--;
  }
}

function powerUp(tick: number): void {
  ship.powerUp();
}

function powerDown(tick: number): void {
  ship.powerDown();
}
