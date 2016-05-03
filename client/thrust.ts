///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/entity/db.ts" />
///<reference path="const.ts" />
///<reference path="util.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-thrust')
  export class Thrust extends polymer.Base {
    @property({type: Object}) db: Core.Entity.Db;
    @property({type: String}) shipId: string;

    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    ready(): void {
      this.can = this.$.canvas;
      this.ctx = this.can.getContext('2d');
    }

    draw(): void {
      let ctx = this.ctx;
      ctx.clearRect(0, 0, this.can.width, this.can.height);
      let w = this.can.width - 1;
      let h = this.can.height - 20;

      const thrust = this.db.velocities[this.shipId];

      let barHeight = Math.round(h / 20);
      let maxHeight = h - barHeight;
      ctx.fillStyle = AQUA;
      ctx.fillRect(HP, snap(maxHeight - (thrust * maxHeight)), w, barHeight);

      ctx.strokeStyle = AQUA;
      ctx.strokeRect(HP, HP, w, h);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = RED;
      const displayThrustValue = Math.round(thrust * 100);
      const thrustWidth = ctx.measureText(displayThrustValue.toString()).width;
      ctx.fillText(displayThrustValue.toString(), w / 2 - thrustWidth / 2,
                   this.can.height);
    }
  }
  Thrust.register();
}
