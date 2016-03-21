///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="const.ts" />

namespace Bridgesim.Client {

  const TILE_PX = 10;
  const BLIP_PX = 2;

  @component('bridgesim-map')
  export class Map extends polymer.Base {
    @property({type: Number}) size: number;
    @property({type: Array}) ships: Core.Ship[];
    @property({type: Object}) ship: Core.Ship;

    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    ready(): void {
      this.can = this.$.canvas;
      this.ctx = this.can.getContext('2d');
      this.ctx.font = '12px roboto mono';
    }

    draw(): void {
      let ctx = this.ctx;

      ctx.clearRect(0, 0, this.can.width, this.can.height);

      ctx.beginPath();
      for (let i = 0; i < this.size + 1; i++) {
        ctx.moveTo(i * TILE_PX + HP, HP);
        ctx.lineTo(i * TILE_PX + HP, this.size * TILE_PX + HP);
        ctx.moveTo(HP, i * TILE_PX + HP);
        ctx.lineTo(this.size * TILE_PX + HP, i * TILE_PX + HP);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = GREEN;
      ctx.stroke();

      let shipImage = new Image();
      shipImage.src = "/images/ship.svg";

      for (let s of this.ships) {
        ctx.beginPath();
        let x = s.x * TILE_PX + TILE_PX / 2 + HP;
        let y = s.y * TILE_PX + TILE_PX / 2 + HP;
        if (this.ship === s) {
          ctx.drawImage(shipImage, x, y, 34 / 3, 59 / 3);
        } else {
          ctx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF0000';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(s.name, x + 10, y + 5);
        ctx.fillText(s.name, x + 10, y + 5);
      }
    }
  }
  Map.register();
}
