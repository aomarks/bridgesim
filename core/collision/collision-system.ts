///<reference path="../ship.ts" />

namespace Bridgesim.Core.Collision {

  export class CollisionSystem {

    resolveCollisions(ships: Core.Ship[]) {
      for (let i = 0; i < ships.length; i++) {
        for (let j = i + 1; j < ships.length; j++) {
          let a = ships[i];
          let b = ships[j];
          let aBox = new BoxCollider(a.x, a.y, 0.01, 0.01, 10);
          let bBox = new BoxCollider(b.x, b.y, 0.01, 0.01, 10);
          if (aBox.isOverlap(bBox)) {
            aBox.resolveCollision(bBox);
            a.setPos(aBox.x, aBox.y);
            b.setPos(bBox.x, bBox.y);
          }
        }
      }
    }
  }
}
