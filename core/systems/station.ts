import {Db} from '../entity/db';
import {dist, every} from '../util';

export class Station {
  private lastTick: number;
  private restockTick: () => void;

  constructor(private db: Db) {
    this.restockTick = every(1, this.restockShips.bind(this));
  }

  public tick(): void {
    const time = +new Date();
    if (!this.lastTick) {
      this.lastTick = time;
    }
    const diff = (time - this.lastTick) / 1000;
    for (let id in this.db.stations) {
      this.tickOne(id, diff);
    }
    this.lastTick = time;

    this.restockTick();
  }

  private restockShips() {
    for (let id in this.db.stations) {
      const curPos = this.db.positions[id];
      for (let shipId in this.db.ships) {
        const pos = this.db.positions[shipId];
        if (dist(curPos, pos) < 1000) {
          this.transferResources(id, shipId);
          break;
        }
      }
    }
  }

  private transferResources(from: string, to: string) {
    const fromRes = this.db.resources[from];
    const toRes = this.db.resources[to];
    for (let res in fromRes) {
      toRes[res] = (toRes[res] || 0) + (fromRes[res] || 0);
      delete fromRes[res];
    }
  }

  private tickOne(thisId: string, diff: number): void {
    const station = this.db.stations[thisId];
    const resources = this.db.resources[thisId];

    // Resource production
    for (let resource in station.produces) {
      // Produce one resource probabilistically every n seconds.
      if (Math.random() < (diff / station.produces[resource])) {
        resources[resource] = (resources[resource] || 0) + 1;
      }
    }
  }
}
