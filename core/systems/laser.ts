import {Db} from '../entity/db';

const RANGE = 10000;

export class Laser {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.lasers) {
      if (this.db.odometers[id].meters > RANGE) {
        this.db.remove(id);
      }
    }
  }
}
