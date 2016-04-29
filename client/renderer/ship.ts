///<reference path="../../bower_components/babylonjs/dist/babylon.2.2.d.ts" />
///<reference path="../../core/ship.ts" />
///<reference path="../asset-pack.ts" />

namespace Bridgesim.Client.Renderer {
  export class Ship {
    public mesh: BABYLON.Mesh;

    private formFittingShield:boolean = false;
    private shield: BABYLON.Mesh;
    private visualMesh: BABYLON.Mesh;
    private shieldMaterial: BABYLON.StandardMaterial;

    constructor(public ship: Core.Ship, public scene: BABYLON.Scene, assetPack: AssetPack.AssetPack) {
      this.mesh = new BABYLON.Mesh('ship', scene);
      const shipAsset = assetPack.ships[0];
      console.log(shipAsset);

      const reflectionTexture = new BABYLON.CubeTexture("textures/skybox/box", scene);

      assetPack.loadShip(shipAsset).then((mesh: BABYLON.Mesh) => {
        this.visualMesh = mesh.clone('');
        this.visualMesh.setEnabled(true);
        this.visualMesh.parent = this.mesh;

        // Set reflection map on mesh
        this.walk(this.visualMesh, (n: BABYLON.Node) => {
          if (n instanceof BABYLON.Mesh) {
            const material = n.material;
            if (material instanceof BABYLON.StandardMaterial) {
              material.reflectionTexture = reflectionTexture;
              material.useReflectionFresnelFromSpecular = true;
            } else if (material instanceof BABYLON.MultiMaterial) {
              for (let m of material.subMaterials) {
                if (m instanceof BABYLON.StandardMaterial) {
                  m.reflectionTexture = reflectionTexture;
                  m.useReflectionFresnelFromSpecular = true;
                }
              }
            }
          }
        });

        if (this.formFittingShield) {
          this.shield = mesh.clone('');
          this.shield.setEnabled(true);
          this.shield.parent = this.mesh;
          this.shield.rotation = this.visualMesh.rotation;

          for (let n of this.shield.getDescendants()) {
            if (n instanceof BABYLON.Mesh) {
              n.scaling.scaleInPlace(1.1);
            }
          }
          this.walk(this.shield, (n: BABYLON.Node) => {
            if (n instanceof BABYLON.Mesh) {
              n.material = this.shieldMaterial;
            }
          });
        }
      });

      // Shield effects
      const material = new BABYLON.StandardMaterial("kosh", scene);
      material.reflectionTexture = reflectionTexture;
      material.diffuseColor = new BABYLON.Color3(0.5, 0.95, 1);
      material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      material.alpha = 0.1;
      material.specularPower = 16;

      // Fresnel
      material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
      material.reflectionFresnelParameters.bias = 0.1;

      material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
      material.emissiveFresnelParameters.bias = 0.6;
      material.emissiveFresnelParameters.power = 4;
      material.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
      material.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();

      material.opacityFresnelParameters = new BABYLON.FresnelParameters();
      material.opacityFresnelParameters.leftColor = BABYLON.Color3.White();
      material.opacityFresnelParameters.rightColor = BABYLON.Color3.Black();
      this.shieldMaterial = material;

      if (!this.formFittingShield) {
        this.shield = BABYLON.Mesh.CreateSphere('shield', 32, 1.5, scene);
        this.shield.position.z += 0.45;
        this.shield.parent = this.mesh;
        this.shield.material = material;
      }

    }

    update(alpha: number) {
      const s = this.ship;
      const lerpX = s.prevX + (alpha * (s.x - s.prevX));
      const lerpY = s.prevY + (alpha * (s.y - s.prevY));
      const lerpHeading = s.prevHeading + (alpha * (s.heading - s.prevHeading));
      this.mesh.position.x = lerpX*100;
      this.mesh.position.z = -lerpY*100;
      this.mesh.rotation.y = Math.PI/180 * lerpHeading;
      if (this.visualMesh) {
        this.visualMesh.rotation.x = -(s.roll*s.roll)/4;
        this.visualMesh.rotation.z = s.roll;
      }
      // visual scaling effect when going fast
      this.mesh.scaling.z = 1/((Math.pow(s.thrust,4)*19)+1)
      this.shield.setEnabled(this.ship.shieldEnabled);
    }

    walk(mesh: BABYLON.Node, cb: (node: BABYLON.Node)=>void) {
      for (let n of mesh.getDescendants()) {
        cb(n);
        this.walk(n, cb);
      }
    }
  }
}
