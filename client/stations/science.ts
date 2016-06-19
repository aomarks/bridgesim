///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../../core/entity/db';
import {dist, heading, formatNumber} from '../../core/util';

@component('science-station')
class Science extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) sel: string;
  @property({type: Boolean}) scanning: boolean;
  @property({type: String}) scanResults: string;

  public animateName(names: any, id: string): string { return names[id] || ''; }

  public hp(healths: any, id: string): number { return healths[id].hp || 0; }

  public shields(healths: any, id: string): boolean {
    return healths[id].shields || false;
  }

  @observe('selected')
  public hideResults() {
    this.scanResults = null;
  }

  public scan(): void {
    this.scanning = true;
    this.scanResults = null;
    setTimeout(() => {
      this.scanning = false;
      this.scanResults = 'Goats Teleported: ' + Math.random() * 100000;
    }, 1000);
  }

  public dist(_, shipA: string, shipB: string): string {
    const distance = dist(this.db.positions[shipA], this.db.positions[shipB]);
    return formatNumber(distance) + 'm';
  }

  public heading(_, shipA: string, shipB: string): string {
    const bearing = heading(this.db.positions[shipA], this.db.positions[shipB]);
    return bearing.toFixed(0) + '°';
  }
}

Science.register();
