import {Db} from '../entity/db';

export class Missile {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.missiles) {
      const traveled = this.db.odometers[id].meters;
      if (traveled > 3000) {
        this.db.motion[id].thrust = 0;
      }
      const missile = this.db.missiles[id];
      if (this.db.odometers[id].meters > missile.range) {
        this.db.remove(id);
      }
    }
  }
}
