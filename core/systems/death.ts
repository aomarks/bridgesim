import {Db} from '../entity/db';
import {Host} from '../host';

export class Death {
  constructor(private db: Db, private host: Host) {}

  public tick(): void {
    let shouldUpdateRoster = false;
    for (let id in this.db.healths) {
      if (this.db.healths[id].hp <= 0) {
        if (this.db.ships[id]) {
          shouldUpdateRoster = true;
        }
        this.db.remove(id);
      }
    }
    if (shouldUpdateRoster) {
      this.host.broadcastRoster();
  }
  }
}
