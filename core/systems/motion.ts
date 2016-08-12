import {Db} from '../entity/db';
import {maxCoord} from '../galaxy';
import {clamp, radians} from '../math';

// Energy consumed by maximum thrust in one tick.
const THRUST_ENERGY = .1;

// Updates the velocity and position of entities in motion.
export class Motion {
  maxCoord: number;
  minCoord: number;

  constructor(private db: Db, galaxySize: number) {
    this.maxCoord = maxCoord(galaxySize);
    this.minCoord = -this.maxCoord;
  }

  tick(): void {
    for (let id in this.db.motion) {
      this.tickOne(id);
    }
  }

  tickOne(id: string): void {
    const mot = this.db.motion[id];
    const pos = this.db.positions[id];
    const pow = this.db.power[id];
    const res = this.db.resources[id];

    if (!mot) {
      console.error('motion: entity has no motion', id);
      return;
    }
    if (!pos) {
      console.error('motion: entity has no position', id);
      return;
    }

    let thrust = mot.thrust;
    if (pow) {
      thrust *= pow.engine;
    }
    if (res) {
      const burn = Math.abs(thrust) * THRUST_ENERGY;
      if (res.energy < burn) {
        thrust = 0;
      } else {
        res.energy -= burn;
      }
    }

    const rads = radians(pos.yaw - 90);
    const accelX = thrust * Math.cos(rads);
    const accelY = thrust * Math.sin(rads);
    mot.velocityX += accelX;
    mot.velocityY -= accelY;
    pos.x += mot.velocityX;
    pos.y += mot.velocityY;

    // Don't allow movement beyond the galaxy border.
    pos.x = clamp(pos.x, this.minCoord, this.maxCoord);
    pos.y = clamp(pos.y, this.minCoord, this.maxCoord);

    pos.roll *= .95;
    if (pos.roll < 0.01) {
      pos.roll = 0;
    }

    const odometer = this.db.odometers[id];
    if (odometer != null) {
      odometer.meters += Math.abs(mot.velocityX) + Math.abs(mot.velocityY);
    }
  }
}
