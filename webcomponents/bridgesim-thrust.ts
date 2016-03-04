///<reference path="../typings/main.d.ts" />
///<reference path="../ts/util.ts" />
///<reference path="../ts/ship.ts" />
///<reference path="../ts/const.ts" />

Polymer({
  is: 'bridgesim-thrust',

  ready() {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
  },

  draw(ship: Ship) {
    let ctx: CanvasRenderingContext2D = this.ctx;
    let w = this.can.width - 1;
    let h = this.can.height - 1;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#AAA';
    ctx.strokeRect(HP, HP, w, h);

    ctx.fillStyle = '#FFF';
    let barHeight = Math.round(h / 20);
    let maxHeight = h - barHeight;

    ctx.fillRect(HP, snap(maxHeight - (ship.thrust * maxHeight)), w, barHeight);
  }
});
