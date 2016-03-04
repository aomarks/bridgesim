///<reference path="../typings/main.d.ts" />
///<reference path="../ts/ship.ts" />

Polymer({
  is: 'bridgesim-game',

  ready() {
    this.size = 60;
    this.ships = [
      new Ship('P28', 30, 30, 0),
      new Ship('A19', 18, 2, 18),
      new Ship('S93', 20, 8, 37),
    ];
    this.ship = this.ships[0];

    this.mpf = 1000 / 60;
    this.prevTs = 0;
    this.lag = 0;

    this.frame(0);
  },

  frame(ts: number) {
    requestAnimationFrame(this.frame.bind(this));
    this.lag += ts - this.prevTs;
    while (this.lag >= this.mpf) {
      this.lag -= this.mpf;
    }
    this.$.map.draw(this.size, this.ships);
    this.$.nav.draw(this.ship);
    this.$.thrust.draw(this.ship);
    this.$.power.draw(this.ship);
  },
});
