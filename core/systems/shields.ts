import {Db} from '../entity/db';

const DEFAULT_SHIELD_REGEN_RATE = 0.5;

export class Shields {
  constructor(private db: Db) {}

  public tick(): void {
    for (let id in this.db.healths) {
      const health = this.db.healths[id];
      if (health.shields >= health.shieldsMax) {
        continue;
      }
      const power = this.db.power[id];
      health.shields = Math.min(
          health.shields + (power ? power.shields : DEFAULT_SHIELD_REGEN_RATE),
          health.shieldsMax);
    }
  }
}
