///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Resource as ResourceCom} from '../core/components';
import {Db} from '../core/entity/db';
import {Resource} from '../core/resources';

@component('resource-display')
export class ResourceDisplay extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  ready(): void {}

  resources(resourcesDb: {[id: string]: ResourceCom}) {
    if (!this.shipId) {
      return;
    }
    const stationResources = resourcesDb[this.shipId].amount;
    const resources = [];
    for (let resource in stationResources) {
      resources.push({
        name: Resource[resource],
        count: stationResources[resource],
      });
    }
    return resources;
  }
}
ResourceDisplay.register();
