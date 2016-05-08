///<reference path="../entity/db.ts" />
///<reference path="../collision/box-collider.ts" />

namespace Bridgesim.Core.Systems {

  export class Collision {
    constructor(private db: Entity.Db) {}

    tick(): void {
      const colliders = {};
      for (let a in this.db.collidables) {
        const aCol = this.db.collidables[a];
        const aPos = this.db.positions[a];
        colliders[a] = new Core.Collision.BoxCollider(aPos.x, aPos.y, aCol.length,
                                                    aCol.width, aCol.mass);
      }
      const collidables = Object.keys(this.db.collidables);
      for (let i = 0; i < collidables.length; i++) {
        const a = collidables[i];
        const aCol = this.db.collidables[a];
        const aPos = this.db.positions[a];
        const aBox = colliders[a];

        for (let j = i+1; j < collidables.length; j++) {
          const b = collidables[j];
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
              healthA.hp -= bCol.damage;
            }
            if (healthB) {
              healthB.hp -= aCol.damage;
            }
          }
        }
      }
    }
  }
}
