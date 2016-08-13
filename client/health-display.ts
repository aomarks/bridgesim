///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';

interface Health {
  hp: number;
  hpMax: number;
  shieldsUp: boolean;
  shields: number;
  shieldsMax: number;
}

@component('health-display')
export class HealthDisplay extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  @observe('shipId')
  observeShipId() { this.updateHealth(); }

  @observe('db.healths.*')
  observeHealths() { this.updateHealth(); }

  @property({type: Object}) health: Health;
  updateHealth() {
    if (!this.db) {
      return;
    }
    const health = this.db.healths[this.shipId];
    if (!health) {
      return;
    }
    this.health = {
      hp: health.hp,
      hpMax: health.hpMax,
      shieldsUp: health.shieldsUp,
      shields: health.shields,
      shieldsMax: health.shieldsMax,
    };
  }
}
HealthDisplay.register();
