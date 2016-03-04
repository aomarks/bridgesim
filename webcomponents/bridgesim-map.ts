///<reference path="../typings/main.d.ts" />
///<reference path="../ts/ship.ts" />

Polymer({
  is: 'bridgesim-map',

  ready() { this.ctx = (<HTMLCanvasElement>this.$.canvas).getContext('2d'); },

  draw: function(size, ships) {
    let ctx = this.ctx;
    let TILE_PX = 10;
    let HP = 0.5;

    ctx.beginPath();
    for (let i = 0; i < size; i++) {
      ctx.moveTo(i * TILE_PX + HP, HP);
      ctx.lineTo(i * TILE_PX + HP, 600 + HP);
      ctx.moveTo(0 + HP, i * TILE_PX + HP);
      ctx.lineTo(600 + HP, i * TILE_PX + HP);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#8BC34A';
    ctx.stroke();

    for (let s of ships) {
      ctx.beginPath();
      let x = s.x * TILE_PX + TILE_PX / 2 + HP;
      let y = s.y * TILE_PX + TILE_PX / 2 + HP;
      ctx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
      // if (ship === s) {
      //  ctx.fillStyle = '#00C2D8';
      //} else {
      ctx.fillStyle = '#FF0000';
      //}
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(s.name, x + 10, y + 5);
      ctx.fillText(s.name, x + 10, y + 5);
    }
  },
});
