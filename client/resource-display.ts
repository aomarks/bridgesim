///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';
import {Resource} from '../core/resources';

@component('resource-display')
export class ResourceDisplay extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  ready(): void {}

  resources(resourcesDb: {[id: string]: {[type: string]: number}}) {
    const stationResources = resourcesDb[this.shipId];
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
