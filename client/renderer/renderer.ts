///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../bower_components/babylonjs/dist/babylon.2.2.d.ts" />
///<reference path="../../core/ship.ts" />
///<reference path="./ship.ts" />

namespace Bridgesim.Client.Renderer {

  const SKYBOX_EXTENSIONS = ["_right1.png", "_top3.png", "_front5.png", "_left2.png",
    "_bottom4.png", "_back6.png"];

  @component('bridgesim-renderer')
  export class Renderer extends polymer.Base {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera: BABYLON.FreeCamera;

    private renderShips: Ship[] = [];
    private shipMap: { [shipName: string]: Ship; } = {};

    @property({type: Number}) size: number;
    @property({type: Array}) ships: Core.Ship[];
    @property({type: Object}) ship: Core.Ship;

    ready() {
      this.engine = new BABYLON.Engine(this.$.renderCanvas, true);
      this.scene = new BABYLON.Scene(this.engine);

      this.camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5,-10), this.scene);
      this.camera.setTarget(BABYLON.Vector3.Zero());
      this.camera.attachControl(this.$.renderCanvas, false);

      const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this.scene);

      // Grid
      const gridMaterial = new BABYLON.StandardMaterial("Grid Material", this.scene);
      gridMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
      gridMaterial.wireframe = true;
      var trueSize = this.size/10;
      const grid = BABYLON.Mesh.CreateGround('ground1', trueSize, trueSize, trueSize, this.scene);
      grid.material = gridMaterial;
      grid.position.x += trueSize/2 - 0.5;
      grid.position.z += trueSize/2 - 0.5;

      // Skybox
      const skybox = BABYLON.Mesh.CreateBox("skyBox", 800.0, this.scene);
      const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/box", this.scene, SKYBOX_EXTENSIONS);
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skybox.material = skyboxMaterial;

      window.addEventListener('resize', this.resize.bind(this));
    }

    attached() {
      this.resize();
    }

    resize() {
      const canvas = this.$.renderCanvas;
      canvas.setAttribute("height", window.innerHeight - canvas.offsetTop - 10 + 'px');
      this.engine.resize();
    }

    draw(localAlpha: number, remoteAlpha: number) {
      this.updateShips(localAlpha, remoteAlpha);
      this.scene.render();
    }

    updateShips(localAlpha: number, remoteAlpha: number) {
      const touched: { [shipName: string]: boolean; } = {};

      // Update each Renderer.Ship
      for (let coreShip of this.ships) {
        let ship = this.shipMap[coreShip.name];
        if (!ship) {
          ship = new Ship(coreShip, this.scene);
          this.renderShips.push(ship);
          this.shipMap[coreShip.name] = ship;
        }
        touched[coreShip.name] = true;

        const alpha = coreShip === this.ship ? localAlpha: remoteAlpha;
        ship.update(alpha);
      }

      // Remove old ships
      this.renderShips = this.renderShips.filter((ship: Ship): boolean => {
        const name = ship.ship.name;
        const keep = touched[name];
        if (!keep) {
          delete this.shipMap[name];
        }
        return keep;
      });
    }
  }

  Renderer.register();
}
