import {Position} from '../components';
import {Db} from '../entity/db';
import {randPoint} from '../galaxy';
import {dist, heading, headingToRadians} from '../math';
import {Pathfinder} from '../pathfinding';
import {every} from '../util';

export class Ai {
  constructor(private db: Db, private galaxySize: number) {}

  public tick = every(1, () => {
    const finder = new Pathfinder(this.db, this.galaxySize);
    for (let id in this.db.ais) {
      this.tickOne(id, finder);
    }
  });

  tickOne(thisId: string, finder: Pathfinder): void {
    const thisPos = this.db.positions[thisId];
    const ai = this.db.ais[thisId];
    let targetPos = ai.targetPos;
    if (!targetPos || dist(thisPos, targetPos) < 1200) {
      const newTarget = randPoint(this.galaxySize);
      // Make sure there is a valid path.
      if (finder.find(thisPos, newTarget, thisId).length > 0) {
        ai.targetPos = targetPos = newTarget;
      }
      return;
    }
    const mot = this.db.motion[thisId];
    const path = finder.find(thisPos, targetPos, thisId);
    if (path.length == 0) {
      mot.velocityX = 0;
      mot.velocityY = 0;
      return;
    }

    let targetIdx = Math.min(2, path.length - 1);
    const localTarget = path[targetIdx];
    thisPos.yaw = heading(localTarget, thisPos);

    // AIs don't know how to turn and thrust. They just directly set their
    // velocity vector.
    const rads = headingToRadians(thisPos.yaw);
    const velocity = 20;
    mot.velocityX = Math.cos(rads) * velocity;
    mot.velocityY = Math.sin(rads) * velocity;
  }
}
