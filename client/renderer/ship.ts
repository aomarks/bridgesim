///<reference path="../../bower_components/babylonjs/dist/babylon.2.2.d.ts" />
///<reference path="../../core/ship.ts" />
///<reference path="../asset-pack.ts" />

namespace Bridgesim.Client.Renderer {
  export class Ship {
    public ship: Core.Ship;
    public mesh: BABYLON.Mesh;

    private visualMesh: BABYLON.Mesh;

    constructor(ship: Core.Ship, scene: BABYLON.Scene, assetPack: AssetPack.AssetPack) {
      this.ship = ship;
      this.mesh = new BABYLON.Mesh('ship', scene);
      const shipAsset = assetPack.ships[0];
      console.log(shipAsset);
      assetPack.loadShip(shipAsset).then((mesh: BABYLON.Mesh) => {
        this.visualMesh = mesh.clone('');
        this.visualMesh.parent = this.mesh;
      });
    }

    update(alpha: number) {
      const s = this.ship;
      const lerpX = s.prevX + (alpha * (s.x - s.prevX));
      const lerpY = s.prevY + (alpha * (s.y - s.prevY));
      this.mesh.position.x = lerpX*100;
      this.mesh.position.z = -lerpY*100;
      this.mesh.rotation.y = Math.PI/180 * s.heading;
      if (this.visualMesh) {
        this.visualMesh.rotation.x = -(s.roll*s.roll)/4;
        this.visualMesh.rotation.z = s.roll;
      }
      // visual scaling effect when going fast
      this.mesh.scaling.z = 1/((Math.pow(s.thrust,4)*19)+1)
    }
  }
}
