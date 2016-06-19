///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as Components from '../core/components';
import {Db} from '../core/entity/db';

@component('bridgesim-power')
export class Power extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) curSubsystem: string;
  @property({computed: 'computeSubsystemNames(db.power)'})
  subsystemNames: string[];

  private computeSubsystemNames(powerDb: Components.Power): string[] {
    const power = powerDb[this.shipId] || {};
    const names = Object.keys(power);
    return names.sort();
  }

  private subsystemLevel(
      powerDb: {[id: string]: Components.Power}, shipId: string,
      subsystem: string): any {
    return 'height: ' + powerDb[shipId][subsystem] + '%';
  }

  private subsystemActive(curSubsystem: string, subsystem: string): boolean {
    return curSubsystem === subsystem;
  }
}
Power.register();
