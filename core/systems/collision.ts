import {BoxCollider} from '../collision/box-collider';
import {Db} from '../entity/db';
import {maxCoord} from '../galaxy';
import {Quadtree} from '../quadtree';

export class Collision {
  private quadtree: Quadtree<string>;
  constructor(private db: Db, galaxySize: number) {
    const max = maxCoord(galaxySize);
    this.quadtree = new Quadtree<string>(-max, -max, max, max);
  }

  tick(): void {
    this.quadtree.clear();
    const colliders = {};
    for (let a in this.db.collidables) {
      const {length, width, mass} = this.db.collidables[a];
      const {x, y} = this.db.positions[a];
      colliders[a] = new BoxCollider(x, y, length, width, mass);
      this.quadtree.insert(a, x, y, x + length, y + width);
    }
    const collidables = Object.keys(this.db.collidables);
    const collided = {};
    for (let i = 0; i < collidables.length; i++) {
      const a = collidables[i];
      const aCol = this.db.collidables[a];
      const aPos = this.db.positions[a];
      const aBox = colliders[a];
      collided[a] = true;

      const {x, y} = aPos;
      const {length, width} = aCol;
      const potentialCol = this.quadtree.retrieve(x, y, x + length, y + width);
      for (let b of potentialCol) {
        if (collided[b]) {
          continue;
        }
        const bCol = this.db.collidables[b];
        if (aCol.ignore == b || bCol.ignore == a) {
          continue;
        }
        const bPos = this.db.positions[b];
        const bBox = colliders[b];
        if (aBox.isOverlap(bBox)) {
          aBox.resolveCollision(bBox);
          // TODO Previous position.
          aPos.x = aBox.x;
          aPos.y = aBox.y;
          bPos.x = bBox.x;
          bPos.y = bBox.y;
          const healthA = this.db.healths[a];
          const healthB = this.db.healths[b];
          if (healthA) {
            healthA.damage(bCol.damage);
          }
          if (healthB) {
            healthB.damage(aCol.damage);
          }
        }
      }
    }
  }
}
