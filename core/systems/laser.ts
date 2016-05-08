///<reference path="../entity/db.ts" />

namespace Bridgesim.Core.Systems {

  const RANGE = 5;

  export class Laser {
    constructor(private db: Entity.Db) {}

    tick(): void {
      for (let id in this.db.lasers) {
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