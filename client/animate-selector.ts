///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';

interface Entity {
  id: string;
  name: string;
}

function compareId(a: Entity, b: Entity): number {
  return a.id.localeCompare(b.id);
}

@component('animate-selector')
class AnimateSelector extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: Array}) ships: Entity[];
  @property({type: Array}) stations: Entity[];
  @property({type: String, notify: true}) selectedId: string;

  @observe('db.ships.*,db.stations.*,db.names.*')
  recompute() {
    const ships = [];
    for (const id in this.db.ships) {
      ships.push({id: id, name: this.db.names[id].name});
    }
    ships.sort(compareId);
    this.ships = ships;

    const stations = [];
    for (const id in this.db.stations) {
      stations.push({id: id, name: this.db.names[id].name});
    }
    stations.sort(compareId);
    this.stations = stations;
  }
}
AnimateSelector.register();
