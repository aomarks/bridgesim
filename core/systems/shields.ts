import {Db} from '../entity/db';

const DEFAULT_SHIELD_POWER_LEVEL = 0.75;
const SHIELD_REGEN_RATE = 0.02;
// Energy consumed by maximum shield regen in one tick.
const SHIELD_ENERGY = .02;

export class Shields {
  constructor(private db: Db) {}

  public tick(): void {
    for (let id in this.db.healths) {
      const health = this.db.healths[id];
      if (health.shieldsUp) {
        const res = this.db.resources[id];
        if (res.energy < SHIELD_ENERGY) {
          health.shieldsUp = false;
        } else {
          res.energy -= SHIELD_ENERGY;
        }
      }

      if (health.shields >= health.shieldsMax) {
        continue;
      }

      const power = this.db.power[id];
      const power_level =  power ? power.shields : DEFAULT_SHIELD_POWER_LEVEL;
      const regen_rate = power_level * SHIELD_REGEN_RATE;
      health.shields = Math.min(health.shields + regen_rate, health.shieldsMax);
    }
  }
}
