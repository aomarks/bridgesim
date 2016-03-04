///<reference path="../typings/main.d.ts" />
///<reference path="../ts/const.ts" />
///<reference path="../ts/ship.ts" />

Polymer({
  is: 'bridgesim-power',

  ready() {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
  },

  draw(ship: Ship) {
    const PAD = 5;
    const PAD2 = PAD * 2;
    const BAR_W = 40;

    const ctx: CanvasRenderingContext2D = this.ctx;
    const w = this.can.width - 1;
    const h = this.can.height - 1;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#AAA';
    ctx.strokeRect(HP, HP, w, h);

    ctx.fillStyle = '#00F';
    for (let i = 0; i < ship.subsystems.length; i++) {
      let s = ship.subsystems[i];
      ctx.fillRect((i * BAR_W) + PAD + HP, h - PAD + HP, BAR_W - PAD,
                   snap(-((s.level / 100) * (h - PAD2))));
    }

    ctx.strokeStyle = '#F00';
    ctx.strokeRect((ship.curSubsystem * BAR_W) + PAD + HP, PAD + HP,
                   BAR_W - PAD, h - PAD2);
  },
});
