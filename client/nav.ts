///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="../core/util.ts" />
///<reference path="const.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-nav')
  export class Nav extends polymer.Base {
    @property({type: Object}) ship: Core.Ship;

    private can: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    ready(): void {
      this.can = this.$.canvas;
      this.ctx = this.can.getContext('2d');
    }

    draw(): void {
      let ctx: CanvasRenderingContext2D = this.ctx;

      let w = this.can.width;
      let h = this.can.height;
      ctx.clearRect(0, 0, w, h);

      // Draw circle
      ctx.beginPath();
      ctx.arc(w / 2 + HP, w / 2 + HP, w / 2 - 5, 0, 2 * Math.PI);
      // ctx.fillStyle = '#333';
      // ctx.fill();
      ctx.strokeStyle = '#7FDBFF';
      ctx.stroke();

      this.drawDegreeTicks(ctx, w / 2, h / 2, w / 2 - 5, 30, 6);
      this.drawDegreeTicks(ctx, w / 2, h / 2, w / 2 - 5, 5, 4);
      this.drawDegreeLabels(ctx, w / 2, h / 2, w / 2 - 22, 30);

      // Draw heading
      let angle = Bridgesim.Core.radians(this.ship.heading - 90);
      ctx.beginPath();
      ctx.moveTo(w / 2 + HP, w / 2 + HP);
      ctx.lineTo(Math.cos(angle) * (w / 2 - 27) + w / 2 + HP,
                 Math.sin(angle) * (w / 2 - 27) + w / 2 + HP);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw degree markers centered at (centerX, and centerY) of radius |radius|, at
    // degree increments |degreeIncrements|.
    drawDegreeLabels(ctx, centerX, centerY, radius, degreeIncrements) {
      // Translate draw context to centerX, centerY and rotate by |degreeIncrements| for
      // every degree marker.
      ctx.save();
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#7FDBFF";
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

    drawDegreeTicks(ctx, centerX, centerY, radius, degreeIncrements, tickLength) {
      // Translate draw context to centerX, centerY and rotate by |degreeIncrements| for
      // every degree marker.
      ctx.save();
      ctx.strokeStyle = "#7FDBFF";
      for (let i = 0; i < 360; i += degreeIncrements) {
        const char = i.toString();
        const charWidth = ctx.measureText(char).width;
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, -radius + tickLength);
        ctx.stroke();
        ctx.rotate(degreeIncrements * Math.PI / 180);
        ctx.translate(-centerX, -centerY);  // reset translation
      }
      ctx.restore();
    }
  }
  Nav.register();
}
