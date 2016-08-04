import {Db} from '../entity/db';

const RANGE = 30000;

export class Missile {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.missiles) {
      const traveled = this.db.odometers[id].meters;
      if (traveled > 3000) {
        this.db.motion[id].thrust = 0;
      }
      if (this.db.odometers[id].meters > RANGE) {
        this.db.remove(id);
      }
    }
  }
}
