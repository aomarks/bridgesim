///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../../core/entity/db';
import {dist, heading} from '../../core/math';
import {formatNumber} from '../../core/util';

interface Target {
  id: string;
  name: string;
  distance: string;
  heading: string;
}

@component('science-station')
class Science extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) selectedId: string;
  @property({type: Object}) selected: Target;
  @property({type: Boolean}) scanning: boolean;
  @property({type: String}) scanResults: string;

  @observe('selectedId')
  observeSelectedId(selectedId: string) {
    if (!selectedId) {
      this.selected = null;
      return;
    }
    this.selected = {
      id: selectedId,
      name: this.db.names[selectedId].name,
      distance: this.dist(selectedId, this.shipId),
      heading: this.heading(selectedId, this.shipId),
    };
  }

  @observe('db.names.*')
  observeNames() {
    if (!this.selected) {
      return;
    }
    this.set('selected.name', this.db.names[this.selected.id].name);
  }

  @observe('db.positions.*')
  observePositions(change: any) {
    if (!this.shipId || !this.selected) {
      return;
    }
    if (change.path.indexOf('db.positions.' + this.shipId + '.') !== 0 &&
        change.path.indexOf('db.positions.' + this.selected.id + '.') !== 0) {
      return;
    }
    this.set('selected.distance', this.dist(this.selectedId, this.shipId));
    this.set('selected.heading', this.heading(this.selectedId, this.shipId));
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

  public dist(a: string, b: string): string {
    const distance = dist(this.db.positions[a], this.db.positions[b]);
    return formatNumber(distance) + 'm';
  }

  public heading(a: string, b: string): string {
    const bearing = heading(this.db.positions[a], this.db.positions[b]);
    return bearing.toFixed(0) + '°';
  }
}

Science.register();
