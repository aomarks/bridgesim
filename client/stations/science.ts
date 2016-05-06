///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../core/entity/db.ts" />

namespace Bridgesim.Client.Stations {

  @component('science-station')
  class Science extends polymer.Base {
    @property({type: Object}) db: Core.Entity.Db;
    @property({type: String}) sel: string;
    @property({type: Boolean}) scanning: boolean;
    @property({type: String}) scanResults: string;

    draw() {}

    shipIds(ships: any): string[] {
      const ids = Object.keys(ships);
      ids.sort();
      return ids;
    }

    shipName(names: any, id: string): string { return names[id] || ''; }

    hp(healths: any, id: string): number { return healths[id].hp || 0; }

    shields(healths: any, id: string): boolean {
      return healths[id].shields || false;
    }

    scan(): void {
      this.scanning = true;
      this.scanResults = null;
      setTimeout(() => {
        this.scanning = false;
        this.scanResults = 'Goats Teleported: ' + Math.random()*100000;
      }, 3000);
    }
  }

  Science.register();
}
