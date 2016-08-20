///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Power} from '../core/components';
import {Db} from '../core/entity/db';
import * as Net from '../net/message';


@component('bridgesim-input')
class Input extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  private commands: Net.Commands;
  private commandsPersisent: Net.Commands = {};

  public created() {
    this.resetCommands();
  }

  public applyInput(cmds: Net.Commands, persistent: boolean) {
    if (persistent) {
      (Object as any).assign(this.commandsPersisent, cmds);
    } else {
      (Object as any).assign(this.commands, cmds);
    }
  }

  public process(): Net.Commands {
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

  private resetCommands(): void {
    this.commands = {
      fireWeapons: [],
      power: <Power>{},
      thrust: 0,
      turn: 0,
    };
    (Object as any).assign(this.commands, this.commandsPersisent);
  }
}
Input.register();
