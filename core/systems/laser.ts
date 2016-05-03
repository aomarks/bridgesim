///<reference path="../entity/db.ts" />

namespace Bridgesim.Core.Systems {

  const LASER_RANGE = 5;

  export class Laser {
    constructor(private db: Entity.Db) {}

    tick(): void {
      for (let id in this.db.lasers) {
        if (this.db.odometers[id] > LASER_RANGE) {
          this.db.remove(id);
        }
      }
    }
  }
}
