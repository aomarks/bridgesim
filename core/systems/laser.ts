import {Db} from '../entity/db';

const RANGE = 10000;

export class Laser {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.lasers) {
      const traveled = this.db.odometers[id].meters;
      if (traveled > 0) {
        this.db.motion[id].thrust = 0;
      }
      const laser = this.db.lasers[id];
      if (traveled > laser.range) {
        this.db.remove(id);
      }
    }
  }
}
