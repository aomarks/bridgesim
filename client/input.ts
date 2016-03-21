///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/ship.ts" />

namespace Bridgesim.Client {

  // TODO: Key codes are kind of a mess. This should work for Chrome at least.
  // See http://unixpapa.com/js/key.html

  const KEY_ARROW_L = 37;
  const KEY_ARROW_U = 38;
  const KEY_ARROW_R = 39;
  const KEY_ARROW_D = 40;
  const KEY_A = 'A'.charCodeAt(0);
  const KEY_D = 'D'.charCodeAt(0);
  const KEY_H = 'H'.charCodeAt(0);
  const KEY_J = 'J'.charCodeAt(0);
  const KEY_K = 'K'.charCodeAt(0);
  const KEY_L = 'L'.charCodeAt(0);
  const KEY_S = 'S'.charCodeAt(0);
  const KEY_W = 'W'.charCodeAt(0);

  interface HelmCommands {
    yaw: number, thrust: number,
  }

  @component('bridgesim-input')
  class Input extends polymer.Base {
    @property({type: Object}) ship: Core.Ship;

    private keyPressed: {[key: number]: number} = {};
    private keyBindings: {[key: number]: (tick: number) => void};
    private helmCommands: HelmCommands;

    created() {
      this.helmCommands = {yaw: 0, thrust: 0};
      this.keyBindings = {
        [KEY_H]: this.prevSubsystem.bind(this),
        [KEY_L]: this.nextSubsystem.bind(this),
        [KEY_K]: this.powerUp.bind(this),
        [KEY_J]: this.powerDown.bind(this),
      };
      this.keyBindings[KEY_W] = () => this.helmCommands.thrust = 1;
      this.keyBindings[KEY_S] = () => this.helmCommands.thrust = -1;
      this.keyBindings[KEY_A] = () => this.helmCommands.yaw = -1;
      this.keyBindings[KEY_D] = () => this.helmCommands.yaw = 1;
    }

    ready(): void {
      window.addEventListener('keydown', this.onKeydown.bind(this));
      window.addEventListener('keyup', this.onKeyup.bind(this));
    }

    onKeydown(event: KeyboardEvent): void {
      if (event.repeat) {
        return;
      }
      this.keyPressed[event.keyCode] = 0;
      // console.log('key down', event.keyCode);
    }

    onKeyup(event: KeyboardEvent): void {
      delete this.keyPressed[event.keyCode];
    }

    process(): void {
      for (let key in this.keyPressed) {
        let fn = this.keyBindings[key];
        if (fn) {
          fn(this.keyPressed[key]);
        }
        this.keyPressed[key]++;
      }
      const gamepad = window.navigator.getGamepads()[0];
      const deadZone = 0.25;
      if (gamepad) {
        if (this.helmCommands.yaw === 0) {
          const yaw = gamepad.axes[0];
          if (Math.abs(yaw) > deadZone) {
            this.helmCommands.yaw = yaw;
          }
        }
        if (this.helmCommands.thrust === 0) {
          this.helmCommands.thrust =
              gamepad.buttons[7].value - gamepad.buttons[6].value;
        }
      }
      this.ship.applyYaw(this.helmCommands.yaw);
      this.ship.applyThrust(this.helmCommands.thrust);
      this.helmCommands.thrust = 0;
      this.helmCommands.yaw = 0;
    }

    nextShip(tick: number): void {
      if (tick > 0) {
        return;
      }
      this.fire('next-ship');
    }

    prevShip(tick: number): void {
      if (tick > 0) {
        return;
      }
      this.fire('prev-ship');
    }

    nextSubsystem(tick: number): void {
      if (tick > 0) {
        return;
      }
      if (this.ship.curSubsystem == this.ship.subsystems.length - 1) {
        this.ship.curSubsystem = 0;
      } else {
        this.ship.curSubsystem++;
      }
    }

    prevSubsystem(tick: number): void {
      if (tick > 0) {
        return;
      }
      if (this.ship.curSubsystem == 0) {
        this.ship.curSubsystem = this.ship.subsystems.length - 1;
      } else {
        this.ship.curSubsystem--;
      }
    }

    powerUp(tick: number): void { this.ship.powerUp(); }

    powerDown(tick: number): void { this.ship.powerDown(); }
  }
  Input.register();
}
