///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />

import {dist} from '../../core/math';
import {Db} from '../../core/entity/db';
import {Resources} from '../../core/components';

interface Entity {
  id: string;
  name: string;
}

@component('comms-station')
class Comms extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: Array}) logs: string[];
  @property({type: String}) selectedId: string;
  @property({type: Object}) selected: Entity;

  @observe('selectedId')
  observeSelectedId(id: string) {
    if (!id) {
      this.selected = null;
      return;
    }
    this.selected = {
      id: id,
      name: this.db.names[id].name,
    };
  }

  @observe('db.names.*')
  observeNames() {
    if (!this.selected) {
      return;
    }
    this.set('selected.name', this.db.names[this.selected.id].name);
  }

  public requestAssistance(e: Event): void {
    const name = this.db.names[this.selected.id].name;
    this.logUs(name + ': Please assist us!');
  }

  public requestSurrender(e: Event): void {
    const name = this.db.names[this.selected.id].name;
    this.logUs(name + ': We request your unconditional surrender!');
  }

  public requestResources(e: Event): void {
    const name = this.db.names[this.selected.id].name;
    this.logUs(name + ': Do you have any resources that we can use?');
    setTimeout(() => {
      const available = [];
      for (const name of Resources.prototype.props) {
        const amount = this.db.resources[this.selected.id][name] || 0;
        if (amount > 0) {
          available.push(name + ' (' + amount + ')');
        }
      }
      this.log(name, 'Available resources: ' + available.join(', '));
    }, 1000);
  }

  public requestDock(e: Event): void {
    const name = this.db.names[this.selected.id].name;
    this.logUs(name + ': We are requesting permission to dock.');
    setTimeout(() => {
      const pos = this.db.positions[this.shipId];
      const stationPos = this.db.positions[this.selected.id];
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

  private logUs(msg: string): void {
    this.log(this.db.names[this.shipId].name, msg);
  }

  private log(from: string, msg: string): void {
    this.$.chat.receiveMsg({
      name: from,
      text: msg,
      timestamp: +new Date(),
    });
  }
}

Comms.register();
