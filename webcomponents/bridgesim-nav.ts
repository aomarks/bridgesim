///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../engine/const.ts" />
///<reference path="../engine/util.ts" />
///<reference path="../engine/ship.ts" />

@component('bridgesim-nav')
class BridgesimNav extends polymer.Base {
  @property({type: Object}) ship: Ship;

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

    ctx.beginPath();
    ctx.arc(w / 2 + HP, w / 2 + HP, w / 2 - 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.stroke();

    let angle = radians(this.ship.heading - 90);
    ctx.beginPath();
    ctx.moveTo(w / 2 + HP, w / 2 + HP);
    ctx.lineTo(Math.cos(angle) * (w / 2 - 8) + w / 2 + HP,
               Math.sin(angle) * (w / 2 - 8) + w / 2 + HP);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
BridgesimNav.register();
