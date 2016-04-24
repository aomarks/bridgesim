///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../bower_components/babylonjs/dist/babylon.2.2.d.ts" />
///<reference path="../typings/browser/ambient/es6-promise/index.d.ts" />

namespace Bridgesim.Client.AssetPack {

  interface Manifest {
    ships: Ship[]
  }

  interface Ship {
    class: string
    faction: string
    model: string
  }

  @component('asset-pack')
  export class AssetPack extends polymer.Base {
    @property({ type: String }) manifest: string;
    @property({ type: Object }) manifestBody: Manifest;
    @property({ type: Object }) scene: BABYLON.Scene;
    @property({ type: Boolean, notify: true }) loaded: boolean = false;

    private modelPromises: { [model: string]: Promise<BABYLON.Mesh> } = {};

    @computed()
    baseURL(manifest: string) : string {
      return this.urlDir(manifest);
    }

    @computed()
    ships(manifestBody: Manifest) : Ship[] {
      return manifestBody.ships;
    }

    response() {
      this.loaded = true;
    }

    urlDir(url: string) : string {
      return url.substring(0, Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"))) + '/';
    }

    loadShip(ship: Ship) : Promise<BABYLON.Mesh> {
      return this.loadModel(ship.class, this.baseURL + ship.model);
    }

    loadModel(name: string, model: string) : Promise<BABYLON.Mesh> {
      console.log('model requested', model);
      if (this.modelPromises[model]) {
        return this.modelPromises[model];
      }
      const promise = new Promise((resolve: (mesh: BABYLON.Mesh) => void, reject: (reason: any) => void) => {
        console.log('loading model', model);
        BABYLON.SceneLoader.ImportMesh(name, "", model, this.scene,
          (meshes: BABYLON.AbstractMesh[], particleSystems: BABYLON.ParticleSystem[], skeletons: BABYLON.Skeleton[]) => {
            console.log('loaded!',model);
            if (meshes.length === 0 || meshes.length > 1) {
              reject('mesh has none/multiple meshes in it');
            } else {
              resolve(meshes[0] as BABYLON.Mesh);
            }
          }, null, (scene: BABYLON.Scene, message: string, exception?: any)  => {
            debugger;
            reject('mesh failed to load: '+model);
          });
      });
      this.modelPromises[model] = promise;
      return promise;
    }
  }

  AssetPack.register();
}
