///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../core/entity/db.ts" />

namespace Bridgesim.Client.Stations {

  @component('science-station')
  class Science extends polymer.Base {
    @property({type: Object}) db: Core.Entity.Db;
    @property({type: String}) sel: string;

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
  }

  Science.register();
}
