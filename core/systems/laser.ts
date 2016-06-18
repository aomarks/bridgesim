import {Db} from "../entity/db";

const RANGE = 10000;

export class Laser {
  constructor(private db: Db) {}

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
