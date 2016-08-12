///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as Components from '../core/components';
import {Db} from '../core/entity/db';

interface Subsystem {
  name: string;
  active: boolean;
  level: number;
}

@component('bridgesim-power')
export class Power extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) curSubsystem: string;
  private subsystems: Subsystem[];

  ready() {
    this.subsystems = [];
    for (name of Components.Power.prototype.props) {
      this.push('subsystems', {
        name: name,
        active: false,
        level: 0,
      });
    }
  }

  @observe('curSubsystem')
  private setActiveSubsystem(name: string) {
    for (const i in this.subsystems || []) {
      const sys = this.subsystems[i];
      this.set(['subsystems', i, 'active'], sys.name === name);
    }
  }

  @observe('shipId,db.power.*')
  private updateLevels(shipId: string, powerChange: any) {
    if (!shipId || !powerChange || !powerChange.base[shipId]) {
      return;
    }
    for (const i in this.subsystems || []) {
      const sys = this.subsystems[i];
      this.set(
          ['subsystems', i, 'level'],
          Math.round(100 * powerChange.base[shipId][sys.name] || 0));
    }
  }

  private height(level: number): string {
    return 'height:' + level.toFixed(3) + '%';
  }
}
Power.register();
