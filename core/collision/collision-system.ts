///<reference path="../ship.ts" />
///<reference path="../body.ts" />

namespace Bridgesim.Core.Collision {

  export interface Collidable {
    body: Body;
    size: number;
    giveDamage: () => number;
    takeDamage: (dmg: number) => void;
  }

  export class CollisionSystem {
    resolveCollisions(entities: Collidable[]) {
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const a = entities[i];
          const b = entities[j];
          const aBox = new BoxCollider(a.body.x, a.body.y, a.size, a.size, 10);
          const bBox = new BoxCollider(b.body.x, b.body.y, b.size, b.size, 10);
          if (aBox.isOverlap(bBox)) {
            aBox.resolveCollision(bBox);
            a.body.setX(aBox.x);
            a.body.setY(aBox.y);
            b.body.setX(bBox.x);
            b.body.setY(bBox.y);
            a.takeDamage(b.giveDamage());
            b.takeDamage(a.giveDamage());
          }
        }
      }
    }
  }
}
