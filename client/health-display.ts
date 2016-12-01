///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';

interface Health {
  hp: number;
  shieldsUp: boolean;
  shields: number;
}

@component('health-display')
export class HealthDisplay extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  @observe('shipId')
  observeShipId() {
    this.updateHealth();
  }

  @observe('db.healths.*')
  observeHealths() {
    this.updateHealth();
  }

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
      hp: health.hp / health.hpMax * 100,
      shieldsUp: health.shieldsUp,
      shields: health.shields / health.shieldsMax * 100,
    };
    console.log(this.health, health);
  }
}
HealthDisplay.register();
