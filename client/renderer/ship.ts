///<reference path="../../bower_components/babylonjs/dist/babylon.2.2.d.ts" />
///<reference path="../../core/ship.ts" />
///<reference path="../asset-pack.ts" />

namespace Bridgesim.Client.Renderer {
  export class Ship {
    public ship: Core.Ship;
    public mesh: BABYLON.Mesh;

    constructor(ship: Core.Ship, scene: BABYLON.Scene, assetPack: AssetPack.AssetPack) {
      this.ship = ship;
      this.mesh = new BABYLON.Mesh('ship', scene);
      const shipAsset = assetPack.ships[0];
      console.log(shipAsset);
      assetPack.loadShip(shipAsset).then((mesh: BABYLON.Mesh) => {
        console.log('ship loaded!');
        const ourMesh = mesh.clone();
        ourMesh.parent = this.mesh;
      });
      /*
      const model = BABYLON.Mesh.CreateBox('box', 0.5, scene);
      model.parent = this.mesh;
      model.scaling.y = 0.5;
      model.scaling.x = 0.5;
      */
    }

    update(alpha: number) {
      const s = this.ship;
      const lerpX = s.prevX + (alpha * (s.x - s.prevX));
      const lerpY = s.prevY + (alpha * (s.y - s.prevY));
      this.mesh.position.x = lerpX*10;
      this.mesh.position.z = -lerpY*10;
      this.mesh.rotation.y = Math.PI/180 * s.heading;
    }
  }
}
