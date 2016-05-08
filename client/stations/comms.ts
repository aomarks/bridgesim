///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../core/entity/db.ts" />
///<reference path="../../core/resources.ts" />

namespace Bridgesim.Client.Stations {
  interface Selected {
    ship?: string;
    station?: string;
  }

  @component('comms-station')
  class Comms extends polymer.Base {
    @property({type: Array}) logs: string[];
    @property({type: String}) shipId: string;
    @property({type: Object}) db: Core.Entity.Db;
    @property({type: Object}) sel: Selected;

    draw() {}

    ids(dict: any): string[] {
      const ids = Object.keys(dict);
      ids.sort();
      return ids;
    }

    idName(names: any, id: string): string { return names[id] || ''; }

    requestAssistance(e: Event): void {
      const name = this.db.names[this.sel.ship];
      this.logUs(name + ': Please assist us!');
    }

    requestSurrender(e: Event): void {
      const name = this.db.names[this.sel.ship];
      this.logUs(name + ': We request your unconditional surrender!');
    }

    requestResources(e: Event): void {
      const name = this.db.names[this.sel.station];
      this.logUs(name + ': Do you have any resources that we can use?');
      setTimeout(() => {
        const station = this.db.stations[this.sel.station];
        const resources = [];
        for (let resource in station.resources) {
          const resourceName = Core.Resource[resource];
          resources.push(resourceName + ' (' + station.resources[resource] + ')');
        }
        this.log(name, 'Available resources: ' + resources.join(', '));
      }, 1000);
    }

    requestDock(e: Event): void {
      const name = this.db.names[this.sel.station];
      this.logUs(name + ': We are requesting permission to dock.');
      setTimeout(() => {
        const pos = this.db.positions[this.shipId];
        const stationPos = this.db.positions[this.sel.station];
        const dist = Math.sqrt(Math.pow(pos.x - stationPos.x, 2) + Math.pow(pos.y - stationPos.y, 2));
        if (dist > 0.25) {
          this.log(name, 'You are currently out of range.');
        } else {
          this.log(name, 'Commencing docking procedures.');
          // TODO: Transfer resources
        }
      }, 1000);
    }

    currentName(): string {
      return this.idName(this.db.names, this.shipId);
    }

    private logUs(msg: string): void {
      this.log(this.currentName(), msg);
    }

    private log(from: string, msg: string): void {
      this.$.chat.receiveMsg({timestamp: +new Date, name: from, text: msg});
    }
  }

  Comms.register();
}
