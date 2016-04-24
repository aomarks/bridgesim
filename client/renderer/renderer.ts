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
    private assetsManager: BABYLON.AssetsManager;
    private camera: BABYLON.ArcRotateCamera;

    private renderShips: Ship[] = [];
    private shipMap: { [shipName: string]: Ship; } = {};
    private skybox: BABYLON.Mesh;

    @property({type: Boolean}) assetsLoaded: boolean = false;

    @property({type: Number}) size: number;
    @property({type: Array}) ships: Core.Ship[];
    @property({type: Object}) ship: Core.Ship;

    ready() {
      this.engine = new BABYLON.Engine(this.$.renderCanvas, true);
      this.scene = new BABYLON.Scene(this.engine);
      this.assetsManager = new BABYLON.AssetsManager(this.scene);
      this.assetsManager.useDefaultLoadingScreen = false;

      this.camera = new BABYLON.ArcRotateCamera('camera1', -Math.PI/2, Math.PI/2, 2, new BABYLON.Vector3(0, 0.5, 0), this.scene);
      this.camera.attachControl(this.$.renderCanvas, false, false);
      this.camera.maxZ = 10000;

      var hdr = new BABYLON.HDRRenderingPipeline("hdr", this.scene, 1.0, [this.camera]);
      hdr.brightThreshold = 0.7; // Minimum luminance needed to compute HDR
      hdr.gaussCoeff = 0.5; // Gaussian coefficient = gaussCoeff * theEffectOutput;
      hdr.gaussMean = 1; // The Gaussian blur mean
      hdr.gaussStandDev = 5; // Standard Deviation of the gaussian blur.
      hdr.exposure = 1.0;
      hdr.minimumLuminance = 0.2;
      hdr.maximumLuminance = 1e20;
      hdr.luminanceDecreaseRate = 0.3; // Decrease rate: darkness to light
      hdr.luminanceIncreaserate = 0.5; // Increase rate: light to darkness
      hdr.gaussMultiplier = 4.0; // Increase the blur intensity

      const light = new BABYLON.DirectionalLight('light1', new BABYLON.Vector3(1,-0.3,0), this.scene);
      light.intensity = 3;

      // Grid
      const gridMaterial = new BABYLON.StandardMaterial("Grid Material", this.scene);
      gridMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
      gridMaterial.wireframe = true;

      const trueSize = this.size*10;
      const cellSize = trueSize/10;
      const grid = BABYLON.Mesh.CreateGround('ground1', trueSize, trueSize, 10, this.scene);
      grid.material = gridMaterial;
      grid.position.x = trueSize/2 - cellSize/2;
      grid.position.z = -trueSize/2 + cellSize/2;
      grid.position.y = -1;

      // Skybox
      const skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, this.scene);
      const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/box", this.scene, SKYBOX_EXTENSIONS);
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skybox.material = skyboxMaterial;
      this.skybox = skybox;

      const sun = BABYLON.Mesh.CreateSphere('sun', 16, 10, this.scene);
      const sunMaterial = new BABYLON.StandardMaterial("sun", this.scene);
      sun.material = sunMaterial;
      sun.position = (new BABYLON.Vector3(-1, 0.3, 0)).normalize().scale(250);

      const lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", sun, this.scene);
      const flare01 = new BABYLON.LensFlare(0.5, 0.2, new BABYLON.Color3(0.5, 0.5, 1), "textures/Flare.png", lensFlareSystem);
      const flare02 = new BABYLON.LensFlare(0.2, 1.0, new BABYLON.Color3(1, 1, 1), "textures/Flare.png", lensFlareSystem);
      const flare03 = new BABYLON.LensFlare(0.4, 0.4, new BABYLON.Color3(1, 0.5, 1), "textures/Flare.png", lensFlareSystem);
      const flare04 = new BABYLON.LensFlare(0.1, 0.6, new BABYLON.Color3(1, 1, 1), "textures/Flare.png", lensFlareSystem);
      const flare05 = new BABYLON.LensFlare(0.3, 0.8, new BABYLON.Color3(1, 1, 1), "textures/Flare.png", lensFlareSystem);


      window.addEventListener('resize', this.resize.bind(this));
    }

    attached() {
      this.resize();
    }

    resize() {
      const canvas = this.$.renderCanvas;
      const height = window.innerHeight - this.offsetTop - 10;
      canvas.setAttribute("height", height + 'px');
      this.engine.resize();
    }

    draw(localAlpha: number, remoteAlpha: number) {
      this.updateShips(localAlpha, remoteAlpha);
      this.scene.render();
    }

    updateShips(localAlpha: number, remoteAlpha: number) {
      if (!this.assetsLoaded) {
        return;
      }
      const touched: { [shipName: string]: boolean; } = {};

      // Update each Renderer.Ship
      for (let coreShip of this.ships) {
        let ship = this.shipMap[coreShip.name];
        if (!ship) {
          ship = new Ship(coreShip, this.scene, this.$.assets);
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

      // Update camera parent incase it's changed.
      const currentShip = this.shipMap[this.ship.name];
      this.camera.parent = currentShip.mesh;
      this.skybox.position = currentShip.mesh.position;
    }
  }

  Renderer.register();
}
