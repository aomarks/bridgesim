///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../bower_components/babylonjs/dist/babylon.2.3.d.ts" />
///<reference path="../typings/browser.d.ts" />

interface Manifest {
  ships: Ship[];
}

interface Ship {
  faction: string;
  model: string;
  scale: number;
}

@component('asset-pack')
export class AssetPack extends polymer.Base {
  @property({type: String}) manifest: string;
  @property({type: Object}) manifestBody: Manifest;
  @property({type: Object}) scene: BABYLON.Scene;
  @property({type: Boolean, notify: true}) loaded: boolean=false;

  private modelPromises: {[model: string]: Promise<BABYLON.Mesh>} = {};

  @computed()
  baseURL(manifest: string): string {
    return this.urlDir(manifest);
  }

  @property({type: Object, computed: 'computeShips(manifestBody)'})
  ships: Ship[];

  computeShips(manifestBody: Manifest): Ship[] { return manifestBody.ships; }

  response() { this.loaded = true; }

  urlDir(url: string): string {
    return url.substring(
               0, Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"))) +
        '/';
  }

  urlBase(url: string): string {
    return url.substring(url.lastIndexOf("/") + 1);
  }

  loadShip(ship: Ship): Promise<BABYLON.Mesh> {
    return this.loadModel(this.baseURL + ship.model)
        .then((mesh: BABYLON.Mesh): BABYLON.Mesh => {
          const scaling = ship.scale ? ship.scale : 1;
          mesh.scaling.x = scaling;
          mesh.scaling.y = scaling;
          mesh.scaling.z = scaling;
          return mesh;
        });
  }

  loadModel(model: string): Promise<BABYLON.Mesh> {
    if (this.modelPromises[model]) {
      return this.modelPromises[model];
    }

    const promise = new Promise(
        (resolve: (mesh: BABYLON.Mesh) => void,
         reject: (reason: any) => void) => {
          const rootURL = this.urlDir(model);
          const baseURL = this.urlBase(model);
          BABYLON.SceneLoader.ImportMesh(
              "", rootURL, baseURL, this.scene,
              (meshes: BABYLON.AbstractMesh[],
               particleSystems: BABYLON.ParticleSystem[],
               skeletons: BABYLON.Skeleton[]) => {
                const mesh = new BABYLON.Mesh(model, this.scene);
                mesh.setEnabled(false);
                for (let m of meshes) {
                  m.parent = mesh;
                }
                resolve(mesh);
              },
              null, (scene: BABYLON.Scene, message: string,
                     exception?: any) => { reject(message); });
        });
    this.modelPromises[model] = promise;
    return promise;
  }
}

AssetPack.register();
