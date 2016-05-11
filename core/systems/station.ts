import {Db} from "../entity/db";

export class Station {
  constructor(private db: Db) {}

  private lastTick: number;

  tick(): void {
    const time = +new Date();
    if (!this.lastTick) {
      this.lastTick = time;
    }
    const diff = (time - this.lastTick) / 1000;
    for (let id in this.db.stations) {
      this.tickOne(id, diff);
    }
    this.lastTick = time;
  }

  tickOne(thisId: string, diff: number): void {
    const station = this.db.stations[thisId];
    for (let resource in station.produces) {
      // Produce one resource probabilistically every n seconds.
      if (Math.random() < (diff / station.produces[resource])) {
        station.resources[resource] = (station.resources[resource] || 0) + 1;
      }
    }
  }
}
