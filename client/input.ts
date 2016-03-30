///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/ship.ts" />

namespace Bridgesim.Client {

  // TODO: Key codes are kind of a mess. This should work for Chrome at least.
  // See http://unixpapa.com/js/key.html
  function keyCode(ch: string): number { return ch.charCodeAt(0); }

  interface Commands {
    yaw: number, thrust: number, power: number
  }

  @component('bridgesim-input')
  class Input extends polymer.Base {
    @property({type: Object}) ship: Core.Ship;

    private keys: {
      [key: number]: {
        binding: () => void,  // What to do when key activated.
        repeat?: boolean,     // Should we run on every tick when held down?
        pressed?: boolean,    // Was the key pressed since we last sampled?
        down?: boolean,       // Is the key being held down?
      }
    };

    private commands: Commands;

    created() {
      this.commands = {yaw: 0, thrust: 0, power: 0};
      this.keys = {
        [keyCode('W')]: {binding: () => this.commands.thrust = 1, repeat: true},
        [keyCode('S')]:
            {binding: () => this.commands.thrust = -1, repeat: true},
        [keyCode('A')]: {binding: () => this.commands.yaw = -1, repeat: true},
        [keyCode('D')]: {binding: () => this.commands.yaw = 1, repeat: true},
        [keyCode('K')]: {binding: () => this.commands.power = 1, repeat: true},
        [keyCode('J')]: {binding: () => this.commands.power = -1, repeat: true},
        [keyCode('H')]: {binding: () => this.prevSubsystem()},
        [keyCode('L')]: {binding: () => this.nextSubsystem()},
      };
    }

    ready(): void {
      window.addEventListener('keydown', this.onKeydown.bind(this));
      window.addEventListener('keyup', this.onKeyup.bind(this));
      window.addEventListener('blur', this.onBlur.bind(this));
    }

    onKeydown(event: KeyboardEvent): void {
      if (event.repeat) {
        return;
      }
      const key = this.keys[event.keyCode];
      if (key) {
        key.binding();
        key.pressed = true;
        key.down = true;
      }
    }

    onKeyup(event: KeyboardEvent): void {
      const key = this.keys[event.keyCode];
      if (key) {
        key.down = false;
      }
    }

    onBlur(): void {
      for (let code in this.keys) {
        this.keys[code].down = false;
      }
    }

    process(): void {
      for (let code in this.keys) {
        const key = this.keys[code];
        if (key.repeat && key.down && !key.pressed) {
          key.binding();
        }
        key.pressed = false;
      }

      const gamepad = window.navigator.getGamepads()[0];
      const deadZone = 0.25;
      if (gamepad) {
        if (this.commands.yaw === 0) {
          const yaw = gamepad.axes[0];
          if (Math.abs(yaw) > deadZone) {
            this.commands.yaw = yaw;
          }
        }
        if (this.commands.thrust === 0) {
          this.commands.thrust =
              gamepad.buttons[7].value - gamepad.buttons[6].value;
        }
      }

      this.ship.applyYaw(this.commands.yaw);
      this.ship.applyThrust(this.commands.thrust);
      this.ship.applyPower(this.commands.power);
      this.commands.thrust = 0;
      this.commands.yaw = 0;
      this.commands.power = 0;
    }

    nextSubsystem(): void {
      // TODO Consider deferring actually changing subsystem until process.
      if (this.ship.curSubsystem == this.ship.subsystems.length - 1) {
        this.ship.curSubsystem = 0;
      } else {
        this.ship.curSubsystem++;
      }
    }

    prevSubsystem(): void {
      if (this.ship.curSubsystem == 0) {
        this.ship.curSubsystem = this.ship.subsystems.length - 1;
      } else {
        this.ship.curSubsystem--;
      }
    }
  }
  Input.register();
}
