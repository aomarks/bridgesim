///<reference path="../ship.ts" />

namespace Bridgesim.Core.Collision {

  export class CollisionSystem {
    resolveCollisions(ships: Core.Ship[]) {
      for (let i = 0; i < ships.length; i++) {
        for (let j = i + 1; j < ships.length; j++) {
          let a = ships[i].body;
          let b = ships[j].body;
          let aBox = new BoxCollider(a.x, a.y, 0.01, 0.01, 10);
          let bBox = new BoxCollider(b.x, b.y, 0.01, 0.01, 10);
          if (aBox.isOverlap(bBox)) {
            aBox.resolveCollision(bBox);
            a.setX(aBox.x);
            a.setY(aBox.y);
            b.setX(bBox.x);
            b.setY(bBox.y);
          }
        }
      }
    }
  }
}
