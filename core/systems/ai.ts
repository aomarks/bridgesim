import {Position} from '../components';
import {Db} from '../entity/db';

export class Ai {
  constructor(private db: Db) {}

  tick(): void {
    for (let id in this.db.ais) {
      this.tickOne(id);
    }
  }

  tickOne(thisId: string): void {
    // basic swarm logic, move towards/away nearest ship.
    const thisPos = this.db.positions[thisId];
    let nearestId: string = null;
    let nearestDist = 0;
    let nearestPos: Position;
    for (let thatId in this.db.ships) {
      if (thisId === thatId) {
        continue;
      }
      const thatPos = this.db.positions[thatId];
      const dist = Math.sqrt(
          Math.pow(thatPos.x - thisPos.x, 2) +
          Math.pow(thatPos.y - thisPos.y, 2));
      if (nearestId === null || nearestDist > dist) {
        nearestId = thatId;
        nearestDist = dist;
        nearestPos = thatPos;
      }
    }
    if (nearestId === null || nearestDist < 0.1) {
      this.db.velocities[thisId] = 0;
      return;
    }
    const friendliness = -1;  // TODO
    const thetaRadians =
        Math.atan2(nearestPos.y - thisPos.y, nearestPos.x - thisPos.x);
    const thetaDegrees = (thetaRadians + Math.PI * (friendliness / 2 + 0.5)) *
        360.0 / (2.0 * Math.PI);
    thisPos.yaw = thisPos.yaw * (59 / 60) + thetaDegrees * (1 / 60);
    this.db.velocities[thisId] = 0.1;
  }
}
