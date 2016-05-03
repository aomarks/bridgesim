///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Client {

  // TODO: Key codes are kind of a mess. This should work for Chrome at least.
  // See http://unixpapa.com/js/key.html
  function keyCode(ch: string): number { return ch.charCodeAt(0); }

  @component('bridgesim-input')
  class Input extends polymer.Base {
    @property({type: String, notify: true}) curSubsystem: string;

    private keys: {
      [key: number]: {
        binding: () => void,  // What to do when key activated.
        repeat?: boolean,     // Should we run on every tick when held down?
        pressed?: boolean,    // Was the key pressed since we last sampled?
        down?: boolean,       // Is the key being held down?
      }
    };

    private commands: Net.Commands;

    created() {
      this.resetCommands();
      this.keys = {
        [keyCode('W')]: {binding: () => this.commands.thrust = 1, repeat: true},
        [keyCode('S')]:
            {binding: () => this.commands.thrust = -1, repeat: true},
        [keyCode('A')]: {binding: () => this.commands.turn = -1, repeat: true},
        [keyCode('D')]: {binding: () => this.commands.turn = 1, repeat: true},
        [keyCode('K')]: {
          binding: () => this.commands.power[this.curSubsystem] = 1,
          repeat: true
        },
        [keyCode('J')]: {
          binding: () => this.commands.power[this.curSubsystem] = -1,
          repeat: true
        },
        [keyCode('H')]: {binding: () => this.prevSubsystem()},
        [keyCode('L')]: {binding: () => this.nextSubsystem()},
        [keyCode(' ')]: {binding: () => this.commands.fire = true},
      };
    }

    resetCommands(): void {
      this.commands = {
        turn: 0,
        thrust: 0,
        power:<Core.Components.Power>{},
        fire: false,
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

    process(): Net.Commands {
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
        if (this.commands.turn === 0) {
          const turn = gamepad.axes[0];
          if (Math.abs(turn) > deadZone) {
            this.commands.turn = turn;
          }
        }
        if (this.commands.thrust === 0) {
          this.commands.thrust =
              gamepad.buttons[7].value - gamepad.buttons[6].value;
        }
      }

      const prev = this.commands;
      this.resetCommands();
      return prev;
    }

    // TODO Actually cycle.
    nextSubsystem(): void { this.curSubsystem = 'maneuvering'; }
    prevSubsystem(): void { this.curSubsystem = 'engine'; }
  }
  Input.register();
}
