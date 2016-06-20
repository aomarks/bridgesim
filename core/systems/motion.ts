import {Db} from '../entity/db';
import {maxCoord} from '../galaxy';
import {clamp, radians} from '../math';


// Updates the position and previous position of entities according to their
// velocity.
export class Motion {
  maxCoord: number;
  minCoord: number;

  constructor(private db: Db, galaxySize: number) {
    this.maxCoord = maxCoord(galaxySize);
    this.minCoord = -this.maxCoord;
  }

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
    const velocity = Math.pow(this.db.velocities[id], 2) * 1000;
    pos.x += velocity * Math.cos(rads);
    pos.y -= velocity * Math.sin(rads);
    // console.log('new position', pos.x, pos.y);

    // Don't allow movement beyond the galaxy border.
    pos.x = clamp(pos.x, this.minCoord, this.maxCoord);
    pos.y = clamp(pos.y, this.minCoord, this.maxCoord);

    pos.roll *= .95;

    const odometer = this.db.odometers[id];
    if (odometer != null) {
      this.db.odometers[id] += velocity;
    }
  }
}
