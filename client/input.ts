///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Power} from '../core/components';
import {Db} from '../core/entity/db';
import * as Net from '../net/message';


// TODO: Key codes are kind of a mess. This should work for Chrome at least.
// See http://unixpapa.com/js/key.html
function keyCode(ch: string): number {
  return ch.charCodeAt(0);
}

@component('bridgesim-input')
class Input extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
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
  private turning: number = 0;

  public created() {
    this.resetCommands();
    this.keys = {
      [keyCode('W')]: {binding: () => this.commands.thrust = 1, repeat: true},
      [keyCode('S')]: {binding: () => this.commands.thrust = -1, repeat: true},
      [keyCode('A')]: {binding: () => this.commands.turn = -1, repeat: true},
      [keyCode('D')]: {binding: () => this.commands.turn = 1, repeat: true},
      [keyCode('K')]: {
        binding: () => this.commands.power[this.curSubsystem] = 5,
        repeat: true,
      },
      [keyCode('J')]: {
        binding: () => this.commands.power[this.curSubsystem] = -5,
        repeat: true,
      },
      [keyCode('H')]: {binding: () => this.prevSubsystem()},
      [keyCode('L')]: {binding: () => this.nextSubsystem()},
      [keyCode(' ')]: {binding: () => this.commands.fireLaser = 0},
      [keyCode('M')]: {binding: () => this.commands.fireMissile = true},
      [keyCode('Z')]: {binding: () => this.commands.toggleShield = true},
    };
  }

  public ready(): void {
    window.addEventListener('keydown', this.onKeydown.bind(this));
    window.addEventListener('keyup', this.onKeyup.bind(this));
    window.addEventListener('blur', this.onBlur.bind(this));
  }

  public process(): Net.Commands {
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

    if (this.turning) {
      this.commands.turn = this.turning;
    }

    const prev = this.commands;
    this.resetCommands();
    return prev;
  }

  private resetCommands(): void {
    this.commands = {
      fireLaser: null,
      fireMissile: false,
      power: <Power>{},
      thrust: 0,
      turn: 0,
    };
  }

  private startLeftTurn() { this.turning = -1; }

  private startRightTurn() { this.turning = 1; }

  private stopTurn() { this.turning = 0; }

  private onKeydown(event: KeyboardEvent): void {
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

  private onKeyup(event: KeyboardEvent): void {
    const key = this.keys[event.keyCode];
    if (key) {
      key.down = false;
    }
  }

  private onBlur(): void {
    for (let code in this.keys) {
      this.keys[code].down = false;
    }
  }

  private nextSubsystem(advance: number = 1): void {
    const power = this.db.power[this.shipId];
    if (!power) {
      return;
    }
    const names = Power.prototype.props;
    let newIdx = (names.indexOf(this.curSubsystem) + advance + names.length) %
        names.length;
    this.curSubsystem = names[newIdx];
  }
  private prevSubsystem(): void { this.nextSubsystem(-1); }
}
Input.register();
