///<reference path="ship.ts" />
///<reference path="host.ts" />

namespace Bridgesim.Core {
  export class ShipAI implements Tickable {
    constructor(public ship: Ship, public friendliness: number, public ships: Ship[]) {
    }
    tick() {
      // basic swarm logic, move towards/away nearest ship.
      let nearest: Ship = null;
      let nearestDist = 0;
      for (let ship of this.ships) {
        if (ship === this.ship) {
          continue;
        }
        const dist = Math.sqrt(Math.pow(ship.body.x-this.ship.body.x, 2) +
                               Math.pow(ship.body.y-this.ship.body.y, 2));
        if (nearest === null || nearestDist > dist) {
          nearest = ship;
          nearestDist = dist;
        }
      }
      if (nearest === null || nearestDist < 0.1) {
        this.ship.thrust = 0;
        return;
      }
      const theta_radians = Math.atan2(nearest.body.y - this.ship.body.y,
                                       nearest.body.x - this.ship.body.x);
      const theta_degrees = (theta_radians + Math.PI * (this.friendliness/2 + 0.5)) * 360.0 / (2.0 * Math.PI);
      this.ship.body.setYaw(this.ship.body.yaw*(59/60) + theta_degrees*(1/60));
      this.ship.thrust = 0.1;
    }
  }
}
