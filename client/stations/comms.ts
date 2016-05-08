///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../core/entity/db.ts" />

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
      const shipName = this.db.names[this.sel.ship];
      this.logUs(shipName + ': Please assist us!');
    }

    requestSurrender(e: Event): void {
      const shipName = this.db.names[this.sel.ship];
      this.logUs(shipName + ': We request your unconditional surrender!');
    }

    requestResources(e: Event): void {
      const shipName = this.db.names[this.sel.station];
      this.logUs(shipName + ': Do you have any resources that we can use?');
    }

    requestDock(e: Event): void {
      const shipName = this.db.names[this.sel.station];
      this.logUs(shipName + ': We are requesting permission to dock.');
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
