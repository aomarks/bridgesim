///<reference path="../typings/main.d.ts" />
///<reference path="../ts/const.ts" />
///<reference path="../ts/util.ts" />
///<reference path="../ts/ship.ts" />

Polymer({
  is: 'bridgesim-nav',

  properties: {
    ship: {type: Object},
  },

  ready() {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
  },

  draw() {
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
  },
});
