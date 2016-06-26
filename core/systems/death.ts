import {Db} from '../entity/db';

export class Death {
  constructor(private db: Db) {}

  public tick(): void {
    for (let id in this.db.healths) {
      if (this.db.healths[id].hp <= 0) {
        this.db.remove(id);
      }
    }
  }
}
