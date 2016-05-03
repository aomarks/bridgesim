///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../bower_components/babylonjs/dist/babylon.2.3.d.ts" />
///<reference path="../../core/entity/db.ts" />
///<reference path="./ship.ts" />

namespace Bridgesim.Client.Renderer {

  export const SKYBOX_EXTENSIONS = [
    "_right1.png",
    "_top3.png",
    "_front5.png",
    "_left2.png",
    "_bottom4.png",
    "_back6.png"
  ];

  @component('bridgesim-renderer')
  export class Renderer extends polymer.Base {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private assetsManager: BABYLON.AssetsManager;
    private camera: BABYLON.ArcRotateCamera;

    private renderShips: Ship[] = [];
    private shipMap: { [shipId: string]: Ship; }
    = {};
    private skybox: BABYLON.Mesh;

    @property({type: Boolean}) assetsLoaded: boolean=false;

    @property({type: Number}) size: number;

    @property({type: Object}) db: Core.Entity.Db;
    @property({type: String}) shipId: string;

    ready() {
      this.engine = new BABYLON.Engine(this.$.renderCanvas, true);
      this.scene = new BABYLON.Scene(this.engine);
      this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
      this.assetsManager = new BABYLON.AssetsManager(this.scene);
      this.assetsManager.useDefaultLoadingScreen = false;

      this.camera = new BABYLON.ArcRotateCamera(
          'camera1', -Math.PI / 2, Math.PI / 2, 2,
          new BABYLON.Vector3(0, 0.0, 0.45), this.scene);
      this.camera.attachControl(this.$.renderCanvas, false, false);
      this.camera.maxZ = 10000;
      this.camera.lowerRadiusLimit = 1.5;
      this.camera.upperRadiusLimit = 50;

      var hdr = new BABYLON.HDRRenderingPipeline("hdr", this.scene, 1.0, null,
                                                 [this.camera]);
      hdr.brightThreshold = 0.7;  // Minimum luminance needed to compute HDR
      hdr.gaussCoeff =
          0.5;  // Gaussian coefficient = gaussCoeff * theEffectOutput;
      hdr.gaussMean = 1;      // The Gaussian blur mean
      hdr.gaussStandDev = 5;  // Standard Deviation of the gaussian blur.
      hdr.exposure = 1.0;
      hdr.minimumLuminance = 0.2;
      hdr.maximumLuminance = 1e20;
      hdr.luminanceDecreaseRate = 0.3;  // Decrease rate: darkness to light
      hdr.luminanceIncreaserate = 0.5;  // Increase rate: light to darkness
      // hdr.gaussMultiplier = 4.0; // Increase the blur intensity

      const light = new BABYLON.DirectionalLight(
          'light1', new BABYLON.Vector3(1, 0, 0), this.scene);
      light.intensity = 1;

      // Grid
      const gridMaterial =
          new BABYLON.StandardMaterial("Grid Material", this.scene);
      gridMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
      gridMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
      gridMaterial.wireframe = true;

      const trueSize = this.size * 10;
      const cellSize = trueSize / 10;
      const grid = BABYLON.Mesh.CreateGround('ground1', trueSize, trueSize, 10,
                                             this.scene);
      grid.material = gridMaterial;
      grid.position.x = trueSize / 2 - cellSize / 2;
      grid.position.z = -trueSize / 2 + cellSize / 2;
      grid.position.y = -1;

      // Skybox
      const skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, this.scene);
      const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
          "textures/skybox/box", this.scene, SKYBOX_EXTENSIONS);
      skyboxMaterial.reflectionTexture.coordinatesMode =
          BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skybox.material = skyboxMaterial;
      this.skybox = skybox;

      /*const sun = BABYLON.Mesh.CreateSphere('sun', 16, 10, this.scene);
      const sunMaterial = new BABYLON.StandardMaterial("sun", this.scene);
      sun.material = sunMaterial;*/

      const sunMaterial = new BABYLON.StandardMaterial('', this.scene);
      sunMaterial.diffuseTexture =
          new BABYLON.Texture('textures/sun.png', this.scene);
      sunMaterial.diffuseTexture.hasAlpha = true;
      sunMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      sunMaterial.backFaceCulling = false;
      sunMaterial.useAlphaFromDiffuseTexture = true;

      const sun = BABYLON.Mesh.CreatePlane('sun', 70, this.scene);
      sun.material = sunMaterial;
      sun.position = (new BABYLON.Vector3(-1, 0, 0)).normalize().scale(225);
      sun.billboardMode = 7;
      sun.parent = skybox;

      const sunBlur = BABYLON.Mesh.CreatePlane('sun', 50, this.scene);
      sunBlur.scaling.x = 5;
      sunBlur.scaling.y = 0.05;
      sunBlur.material = sunMaterial;
      sunBlur.position = (new BABYLON.Vector3(-1, 0, 0)).normalize().scale(100);
      sunBlur.billboardMode = 7;
      sunBlur.parent = skybox;

      const lensFlareSystem =
          new BABYLON.LensFlareSystem("lensFlareSystem", sun, this.scene);
      const flare01 =
          new BABYLON.LensFlare(0.5, 0.2, new BABYLON.Color3(0.5, 0.5, 1),
                                "textures/Flare.png", lensFlareSystem);
      const flare02 =
          new BABYLON.LensFlare(0.2, 1.0, new BABYLON.Color3(1, 1, 1),
                                "textures/Flare.png", lensFlareSystem);
      const flare03 =
          new BABYLON.LensFlare(0.4, 0.4, new BABYLON.Color3(1, 0.5, 1),
                                "textures/Flare.png", lensFlareSystem);
      const flare04 =
          new BABYLON.LensFlare(0.1, 0.6, new BABYLON.Color3(1, 1, 1),
                                "textures/Flare.png", lensFlareSystem);
      const flare05 =
          new BABYLON.LensFlare(0.3, 0.8, new BABYLON.Color3(1, 1, 1),
                                "textures/Flare.png", lensFlareSystem);


      window.addEventListener('resize', this.resize.bind(this));
    }

    attached() { this.resize(); }

    resize() {
      const canvas = this.$.renderCanvas;
      const height = window.innerHeight - this.offsetTop;
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
      const touched: { [shipId: string]: boolean; }
      = {};

      // Update each Renderer.Ship
      for (let shipId in this.db.ships) {
        let ship = this.shipMap[shipId];
        if (!ship) {
          ship = new Ship(shipId, this.db, this.scene, this.$.assets);
          this.renderShips.push(ship);
          this.shipMap[shipId] = ship;
        }
        touched[shipId] = true;

        const alpha = shipId === this.shipId ? localAlpha : remoteAlpha;
        ship.update(alpha);
      }

      // Remove old ships
      this.renderShips = this.renderShips.filter((ship: Ship): boolean => {
        const shipId = ship.id;
        const keep = touched[shipId];
        if (!keep) {
          delete this.shipMap[shipId];
        }
        return keep;
      });

      // Update camera parent incase it's changed.
      const currentShip = this.shipMap[this.shipId];
      if (currentShip) {
        this.camera.parent = currentShip.mesh;
        this.skybox.position = currentShip.mesh.position;
      }
    }
  }

  Renderer.register();
}
