import {Point, Position} from '../components';
import {Db} from '../entity/db';
import {randPoint} from '../galaxy';
import {dist, heading, headingToRadians} from '../math';
import {Pathfinder} from '../pathfinding';
import {every} from '../util';

export class Ai {
  private previousPaths: {[id: string]: Point[]} = {};
  private newPaths: {[id: string]: Point[]} = {};

  constructor(private db: Db, private galaxySize: number) {}

  public tick = every(1, () => {
    this.newPaths = {};
    const finder = new Pathfinder(this.db, this.galaxySize);
    for (let id in this.db.ais) {
      this.tickOne(id, finder);
    }
    this.previousPaths = this.newPaths;
  });

  tickOne(id: string, finder: Pathfinder): void {
    const thisPos = this.db.positions[id];
    const ai = this.db.ais[id];
    let targetPos = ai.targetPos;
    if (!targetPos || dist(thisPos, targetPos) < 1200) {
      const newTarget = randPoint(this.galaxySize);
      // Make sure there is a valid path.
      if (finder.find(thisPos, newTarget, id).length > 0) {
        ai.targetPos = targetPos = newTarget;
      }
      return;
    }
    const mot = this.db.motion[id];
    const path = finder.find(thisPos, targetPos, id, this.previousPaths[id]);
    this.newPaths[id] = path;
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
