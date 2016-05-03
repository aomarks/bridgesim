///<reference path="../entity/db.ts" />

namespace Bridgesim.Core.Systems {

  const RANGE = 15;

  export class Missile {
    constructor(private db: Entity.Db) {}

    tick(): void {
      for (let id in this.db.missiles) {
        if (this.db.healths[id].hp < 0) {
          this.db.remove(id);
        }
        if (this.db.odometers[id] > RANGE) {
          this.db.remove(id);
        }
      }
    }
  }
}
