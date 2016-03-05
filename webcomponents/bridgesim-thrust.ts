///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../engine/ship.ts" />
///<reference path="const.ts" />
///<reference path="util.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-thrust')
  export class Thrust extends polymer.Base {
    @property({type: Object}) ship: Core.Ship;

    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    ready(): void {
      this.can = this.$.canvas;
      this.ctx = this.can.getContext('2d');
    }

    draw(): void {
      let ctx = this.ctx;
      let w = this.can.width - 1;
      let h = this.can.height - 1;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#AAA';
      ctx.strokeRect(HP, HP, w, h);

      ctx.fillStyle = '#FFF';
      let barHeight = Math.round(h / 20);
      let maxHeight = h - barHeight;

      ctx.fillRect(HP, snap(maxHeight - (this.ship.thrust * maxHeight)), w,
                   barHeight);
    }
  }
  Thrust.register();
}
