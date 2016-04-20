///<reference path="../../bower_components/babylonjs/dist/babylon.2.2.d.ts" />
///<reference path="../../core/ship.ts" />

namespace Bridgesim.Client.Renderer {
  export class Ship {
    public ship: Core.Ship;
    public mesh: BABYLON.Mesh;

    constructor(ship: Core.Ship, scene: BABYLON.Scene) {
      this.ship = ship;
      this.mesh = BABYLON.Mesh.CreateSphere('sphere1', 16, 0.5, scene);
    }

    update(alpha: number) {
      const s = this.ship;
      const lerpX = s.prevX + (alpha * (s.x - s.prevX));
      const lerpY = s.prevY + (alpha * (s.y - s.prevY));
      this.mesh.position.x = lerpX;
      this.mesh.position.z = lerpY;
    }
  }
}
