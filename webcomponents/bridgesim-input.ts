///<reference path="../typings/main.d.ts" />
///<reference path="../ts/const.ts" />
///<reference path="../ts/util.ts" />
///<reference path="../ts/ship.ts" />

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

Polymer({
  is: 'bridgesim-input',

  properties: {
    ship: {type: Object},
  },

  ready() {
    this.keyPressed = {};
    this.keyBindings = {
      [KEY_ARROW_L]: this.turnLeft.bind(this),
      [KEY_ARROW_R]: this.turnRight.bind(this),
      [KEY_ARROW_U]: this.thrustUp.bind(this),
      [KEY_ARROW_D]: this.thrustDown.bind(this),
      [KEY_O]: this.prevShip.bind(this),
      [KEY_P]: this.nextShip.bind(this),
      [KEY_K]: this.prevSubsystem.bind(this),
      [KEY_L]: this.nextSubsystem.bind(this),
      [KEY_W]: this.powerUp.bind(this),
      [KEY_S]: this.powerDown.bind(this),
    };
    addEventListener('keydown', this.onKeydown.bind(this));
    addEventListener('keyup', this.onKeyup.bind(this));
  },

  onKeydown(event: KeyboardEvent) {
    if (event.repeat) {
      return;
    }
    this.keyPressed[event.keyCode] = 0;
    console.log('key down', event.keyCode);
  },

  onKeyup(event: KeyboardEvent) { delete this.keyPressed[event.keyCode]; },

  process() {
    for (let key in this.keyPressed) {
      let fn = this.keyBindings[key];
      if (fn) {
        fn(this.keyPressed[key]);
      }
      this.keyPressed[key]++;
    }
  },

  turnLeft() { this.ship.turnLeft(); },

  turnRight() { this.ship.turnRight(); },

  thrustUp() { this.ship.thrustUp(); },

  thrustDown() { this.ship.thrustDown(); },

  nextShip(tick: number) {
    if (tick > 0) {
      return;
    }
    this.fire('next-ship');
  },

  prevShip(tick: number) {
    if (tick > 0) {
      return;
    }
    this.fire('prev-ship');
  },

  nextSubsystem(tick: number) {
    if (tick > 0) {
      return;
    }
    if (this.ship.curSubsystem == this.ship.subsystems.length - 1) {
      this.ship.curSubsystem = 0;
    } else {
      this.ship.curSubsystem++;
    }
  },

  prevSubsystem(tick: number) {
    if (tick > 0) {
      return;
    }
    if (this.ship.curSubsystem == 0) {
      this.ship.curSubsystem = this.ship.subsystems.length - 1;
    } else {
      this.ship.curSubsystem--;
    }
  },

  powerUp(tick: number) { this.ship.powerUp(); },

  powerDown(tick: number) { this.ship.powerDown(); },
});
