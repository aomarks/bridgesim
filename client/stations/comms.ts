///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />

import {dist} from '../../core/math';
import {Db} from '../../core/entity/db';
import {Resource} from '../../core/resources';

@component('comms-station')
class Comms extends polymer.Base {
  @property({type: Array}) public logs: string[];
  @property({type: String}) public shipId: string;
  @property({type: Object}) public db: Db;

  private selected: string;

  public idName(names: any, id: string): string { return names[id].name || ''; }

  public requestAssistance(e: Event): void {
    const name = this.db.names[this.selected].name;
    this.logUs(name + ': Please assist us!');
  }

  public requestSurrender(e: Event): void {
    const name = this.db.names[this.selected].name;
    this.logUs(name + ': We request your unconditional surrender!');
  }

  public requestResources(e: Event): void {
    const name = this.db.names[this.selected].name;
    this.logUs(name + ': Do you have any resources that we can use?');
    setTimeout(() => {
      const stationResources = this.db.resources[this.selected];
      const resources = [];
      for (let resource in stationResources) {
        const resourceName = Resource[resource];
        resources.push(resourceName + ' (' + stationResources[resource] + ')');
      }
      this.log(name, 'Available resources: ' + resources.join(', '));
    }, 1000);
  }

  public requestDock(e: Event): void {
    const name = this.db.names[this.selected].name;
    this.logUs(name + ': We are requesting permission to dock.');
    setTimeout(() => {
      const pos = this.db.positions[this.shipId];
      const stationPos = this.db.positions[this.selected];
      if (dist(pos, stationPos) > 1000) {
        this.log(name, 'You are currently out of range.');
      } else {
        this.log(name, 'Commencing docking procedures.');
        // TODO: Transfer resources
      }
    }, 1000);
  }

  public isShip(id: string): boolean { return !!this.db.ships[id]; }
  public isStation(id: string): boolean { return !!this.db.stations[id]; }

  private currentName(): string {
    return this.idName(this.db.names, this.shipId);
  }

  private logUs(msg: string): void { this.log(this.currentName(), msg); }

  private log(from: string, msg: string): void {
    this.$.chat.receiveMsg({
      name: from,
      text: msg,
      timestamp: +new Date(),
    });
  }
}

Comms.register();
