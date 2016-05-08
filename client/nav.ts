///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/entity/db.ts" />
///<reference path="../core/util.ts" />
///<reference path="colors.ts" />
///<reference path="const.ts" />
///<reference path="util.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-nav')
  export class Nav extends polymer.Base {
    @property({type: Object}) db: Core.Entity.Db;
    @property({type: String}) shipId: string;

    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    ready(): void {
      this.can = this.$.canvas;
      this.ctx = this.can.getContext('2d');
    }

    draw(alpha: number): void {
      const ctx = this.ctx;

      let w = this.can.width;
      let h = this.can.height;
      ctx.clearRect(0, 0, w, h);

      // Draw circle
      ctx.beginPath();
      ctx.arc(w / 2 + HP, w / 2 + HP, w / 2 - 5, 0, 2 * Math.PI);
      ctx.strokeStyle = AQUA;
      ctx.stroke();

      this.drawDegreeTicks(w / 2, h / 2, w / 2 - 5, 30, 6);
      this.drawDegreeTicks(w / 2, h / 2, w / 2 - 5, 5, 4);
      this.drawDegreeLabels(w / 2, h / 2, w / 2 - 22, 30);

      // Draw heading
      const pos = this.db.positions[this.shipId];
      if (!pos) {
        return;
      }
      let prev = this.db.prevPositions[this.shipId];
      if (!prev) {
        prev = pos;
      }
      const yaw = lerp(pos.yaw, prev.yaw, alpha);
      let angle = Bridgesim.Core.radians(yaw - 90);
      ctx.beginPath();
      ctx.moveTo(w / 2 + HP, w / 2 + HP);
      ctx.lineTo(Math.cos(angle) * (w / 2 - 27) + w / 2 + HP,
                 Math.sin(angle) * (w / 2 - 27) + w / 2 + HP);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw degree markers centered at (centerX, and centerY) of radius
    // |radius|, at degree increments |degreeIncrements|.
    drawDegreeLabels(centerX: number, centerY: number, radius: number,
                     degreeIncrements: number) {
      // Translate draw context to centerX, centerY and rotate by
      // |degreeIncrements| for every degree marker.
      const ctx = this.ctx;
      ctx.save();
      ctx.font = "12px sans-serif";
      ctx.fillStyle = AQUA;
      for (let i = 0; i < 360; i += degreeIncrements) {
        const char = i.toString();
        const charWidth = ctx.measureText(char).width;
        ctx.translate(centerX, centerY);
        ctx.fillText(i.toString(), -charWidth / 2, -radius);
        ctx.rotate(degreeIncrements * Math.PI / 180);
        ctx.translate(-centerX, -centerY);  // reset translation
      }
      ctx.restore();
    }

    drawDegreeTicks(centerX: number, centerY: number, radius: number,
                    degreeIncrements: number, tickLength: number) {
      // Translate draw context to centerX, centerY and rotate by
      // |degreeIncrements| for every degree marker.
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = AQUA;
      ctx.beginPath();
      for (let i = 0; i < 360; i += degreeIncrements) {
        const char = i.toString();
        ctx.translate(centerX, centerY);
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, -radius + tickLength);
        ctx.rotate(degreeIncrements * Math.PI / 180);
        ctx.translate(-centerX, -centerY);  // reset translation
      }
      ctx.stroke();
      ctx.restore();
    }
  }
  Nav.register();
}
