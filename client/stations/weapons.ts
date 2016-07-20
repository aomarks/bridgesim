///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../typings/index.d.ts" />

import {Db} from '../../core/entity/db';
import {heading} from '../../core/math';
import {MapTap} from '../map';

@component('weapons-station')
class Weapons extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

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
    this.fire('fire-laser', {
      heading: heading(ev.detail, this.db.positions[this.shipId]),
    });
  }
}

Weapons.register();
