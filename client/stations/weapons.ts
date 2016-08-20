///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../typings/index.d.ts" />

import {Db} from '../../core/entity/db';
import {heading} from '../../core/math';
import {Weapon, FireWeapon} from '../../core/weapon';
import {MapTap} from '../map';

@component('weapons-station')
class Weapons extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: Object}) weapon: Weapon;

  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
  }

  @listen('map-tap')
  handleMapTap(ev: MapTap) {
    if (!this.shipId || !this.db) {
      return;
    }
    const pos = this.db.positions[this.shipId];
    if (!pos) {
      return;
    }
    const fireWeapon: FireWeapon = {
      heading: heading(ev.detail.world, this.db.positions[this.shipId]),
      target: ev.detail.world,
      weapon: this.weapon,
    };
    this.fire('input', {fireWeapons: [fireWeapon]});
  }
}

Weapons.register();
