import {Db} from '../entity/db';

// Energy required per jump.
const ENERGY_TOTAL = 200;

// Seconds to spool up with maximum power.
const SPOOL_SECS = 10;

// TODO Get tick rate from settings.
const TICK_RATE = 30;

export class Ftl {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.ftl) {
      this.tickOne(id);
    }
  }

  tickOne(id: string) {
    const ftl = this.db.ftl[id];
    if (!ftl || ftl.progress == null) {
      return;
    }

    // Compute incremental progress for this tick from FTL power level.
    let level = 1;
    const pow = this.db.power[id];
    if (pow) {
      level = pow.ftl;
    }
    let inc = level / (SPOOL_SECS * TICK_RATE);

    // Burn energy or halt if not available.
    const res = this.db.resources[id];
    if (res) {
      const burn = inc * ENERGY_TOTAL;
      if (res.energy < burn) {
        inc = 0;
      } else {
        res.energy -= burn;
      }
    }

    // Update progress and ETA.
    ftl.progress += inc;
    if (inc === 0) {
      ftl.eta = -1;
    } else {
      ftl.eta = (1 - ftl.progress) / inc / TICK_RATE;
    }

    // Perform jump when ready.
    if (ftl.progress >= 1) {
      const pos = this.db.positions[id];
      if (pos) {
        pos.x = ftl.x;
        pos.y = ftl.y;
      } else {
        console.error('motion: entity has no position', id);
      }
      ftl.x = null;
      ftl.y = null;
      ftl.progress = null;
      ftl.eta = null;
    }
  }
}
