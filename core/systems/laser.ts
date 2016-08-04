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
      if (traveled > RANGE) {
        this.db.remove(id);
      }
    }
  }
}
