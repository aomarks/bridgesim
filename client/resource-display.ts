///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Resources} from '../core/components';
import {Db} from '../core/entity/db';

interface Resource {
  name: string;
  count: number;
}

@component('resource-display')
export class ResourceDisplay extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: Array}) resources: Resource[];

  @observe('shipId')
  observeShipId(shipId: string) {
    this.updateResources();
  }

  @observe('db.resources.*')
  observeResources(change: any) {
    if (!this.shipId) {
      return;
    }
    if (change.path.indexOf('db.resources.' + this.shipId + '.') !== 0) {
      return;
    }
    this.updateResources();
  }

  updateResources() {
    if (!this.shipId || !this.db || !this.db.resources[this.shipId]) {
      this.resources = [];
      return;
    }

    const resources = [];
    for (const name of Resources.prototype.props) {
      resources.push({
        name: name,
        count: this.db.resources[this.shipId][name] || 0,
      });
    }
    this.resources = resources;
  }
}
ResourceDisplay.register();
