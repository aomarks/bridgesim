///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/entity/db.ts" />
///<reference path="../core/util.ts" />
///<reference path="const.ts" />
///<reference path="colors.ts" />
///<reference path="util.ts" />

namespace Bridgesim.Client {

  const TILE_PX = 50;
  const BLIP_PX = 2;

  @component('bridgesim-map')
  export class Map extends polymer.Base {
    @property({type: Number}) size: number;
    @property({type: Object}) db: Core.Entity.Db;
    @property({type: String}) shipId: string;

    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private shipImage: HTMLImageElement;

    ready(): void {
      this.can = this.$.canvas;
      this.ctx = this.can.getContext('2d');
      this.ctx.font = '11px Share Tech Mono';
      this.shipImage = new Image();
      this.shipImage.src = "/images/ship.svg";
    }

    draw(localAlpha: number, remoteAlpha: number): void {
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

      for (let shipId in this.db.ships) {
        const alpha = shipId === this.shipId ? localAlpha : remoteAlpha;
        const pos = this.db.positions[shipId];
        if (!pos) {
          continue;
        }
        let prev = this.db.prevPositions[shipId];
        if (!prev) {
          prev = pos;
        }
        ctx.beginPath();
        let x = lerp(pos.x, prev.x, alpha) * TILE_PX + TILE_PX / 2 + HP;
        let y = lerp(pos.y, prev.y, alpha) * TILE_PX + TILE_PX / 2 + HP;
        if (shipId === this.shipId) {
          ctx.save();
          ctx.translate(x, y);
          const yaw = lerp(pos.yaw, prev.yaw, alpha);
          ctx.rotate(yaw * Math.PI / 180);
          const shipWidth = 34 / 3;
          const shipHeight = 59 / 3;
          ctx.drawImage(this.shipImage, -shipWidth / 2, -shipHeight / 2,
                        shipWidth, shipHeight);
          ctx.restore();
        } else {
          ctx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF0000';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const name = this.db.names[shipId];
        ctx.strokeText(name, x + 10, y + 5);
        ctx.fillText(name, x + 10, y + 5);

        const health = this.db.healths[shipId];
        if (health != null) {
          ctx.strokeText(health.hp.toString(), x + 10, y + 20);
          ctx.fillText(health.hp.toString(), x + 10, y + 20);
        }
      }

      for (let id in this.db.debris) {
        const pos = this.db.positions[id];
        let prev = this.db.prevPositions[id];
        if (!prev) {
          prev = pos;
        }
        let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
        let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
        ctx.moveTo(x, y);
        ctx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
        ctx.fillStyle = '#964B00';
        ctx.fill();
      }

      for (let id in this.db.lasers) {
        const pos = this.db.positions[id];
        let prev = this.db.prevPositions[id];
        if (!prev) {
          prev = pos;
        }
        let rads = Core.radians(lerp(pos.yaw, prev.yaw, remoteAlpha) - 90);
        ctx.beginPath();
        let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
        let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(rads) * 20, y + Math.sin(rads) * 20);
        ctx.strokeStyle = '#F00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (let id in this.db.missiles) {
        const pos = this.db.positions[id];
        let prev = this.db.prevPositions[id];
        if (!prev) {
          prev = pos;
        }
        let rads = Core.radians(lerp(pos.yaw, prev.yaw, remoteAlpha) - 90);
        ctx.beginPath();
        let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
        let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(rads) * 5, y + Math.sin(rads) * 5);
        ctx.strokeStyle = AQUA;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
  Map.register();
}
