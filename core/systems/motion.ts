import {Db} from "../entity/db";
import {radians} from "../util";

// Updates the position and previous position of entities according to their
// velocity.
export class Motion {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.velocities) {
      this.tickOne(id);
    }
  }

  tickOne(id: string): void {
    const pos = this.db.positions[id];
    if (!pos) {
      console.error('motion: entity has velocity but no position', id);
      return;
    }

    const prev = this.db.prevPositions[id];
    if (prev) {
      prev.x = pos.x;
      prev.y = pos.y;
      prev.roll = pos.roll;
    }

    const rads = radians(pos.yaw - 90);
    // TODO Do this curve somewhere else.
    const velocity = Math.pow(this.db.velocities[id], 2);
    pos.x += velocity * Math.cos(rads);
    pos.y += velocity * Math.sin(rads);
    // console.log('new position', pos.x, pos.y);

    pos.roll *= .95;

    const odometer = this.db.odometers[id];
    if (odometer != null) {
      this.db.odometers[id] += velocity;
    }
  }
}
