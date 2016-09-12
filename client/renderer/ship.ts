///<reference path="../../bower_components/babylonjs/dist/babylon.2.4.d.ts" />

import {Db} from '../../core/entity/db';
import {AssetPack} from '../asset-pack';
import {lerp} from '../util';

import {SKYBOX_EXTENSIONS} from './renderer';

export class Ship {
  public mesh: BABYLON.Mesh;

  private formFittingShield: boolean = false;
  private shield: BABYLON.Mesh;
  private visualMesh: BABYLON.Mesh;
  private shieldMaterial: BABYLON.StandardMaterial;

  constructor(
      public id: string, private db: Db, public scene: BABYLON.Scene,
      assetPack: AssetPack) {
    this.mesh = new BABYLON.Mesh('ship', scene);
    const shipAsset = assetPack.ships[0];

    const reflectionTexture = new BABYLON.CubeTexture(
        'textures/skybox/box', scene, SKYBOX_EXTENSIONS);

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
    const material = new BABYLON.StandardMaterial('kosh', scene);
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
    const pos = this.db.positions[this.id];
    if (!pos) {
      return;
    }
    let prev = this.db.prevPositions[this.id];
    if (prev == null) {
      prev = pos;
    }
    this.mesh.position.x = lerp(pos.x, prev.x, alpha);
    this.mesh.position.z = -lerp(pos.y, prev.y, alpha);
    this.mesh.rotation.y = Math.PI / 180 * lerp(pos.yaw, prev.yaw, alpha);
    const roll = lerp(pos.roll, prev.roll, alpha);
    if (this.visualMesh) {
      this.visualMesh.rotation.x = -(roll * roll) / 4;
      this.visualMesh.rotation.z = roll;
    }

    // TODO kinda broken
    // visual scaling effect when going fast
    // const mot = this.db.motion[this.id];
    // const thrust = (Math.abs(mot.velocityX) + Math.abs(mot.velocityY));
    // this.mesh.scaling.z = 1 / ((Math.pow(thrust, 4) * 19) + 1);

    // TODO shield
    this.shield.setEnabled(false);
  }

  walk(mesh: BABYLON.Node, cb: (node: BABYLON.Node) => void) {
    for (let n of mesh.getDescendants()) {
      cb(n);
      this.walk(n, cb);
    }
  }
}
