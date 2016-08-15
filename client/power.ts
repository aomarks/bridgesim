///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as Components from '../core/components';
import {Db} from '../core/entity/db';

interface Subsystem {
  name: string;
  level: number;
}

@component('bridgesim-power')
export class Power extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  private subsystems: Subsystem[];

  ready() {
    this.subsystems = [];
    for (name of Components.Power.prototype.props) {
      this.push('subsystems', {
        name: name,
        level: 0,
      });
    }
  }

  @observe('shipId,db.power.*')
  private updateLevels(shipId: string, powerChange: any) {
    if (!shipId || !powerChange || !powerChange.base[shipId]) {
      return;
    }
    for (const i in this.subsystems || []) {
      const sys = this.subsystems[i];
      const level = powerChange.base[shipId][sys.name] || 0;
      this.set(['subsystems', i, 'level'], level);
    }
  }
}
Power.register();
