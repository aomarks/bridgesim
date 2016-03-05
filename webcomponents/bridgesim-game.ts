///<reference path="../typings/main.d.ts" />
///<reference path="../engine/ship.ts" />

Polymer({
  is: 'bridgesim-game',

  ready() {
    this.size = 60;
    this.ships = [
      new Ship('P28', 30, 30, 0),
      new Ship('A19', 18, 2, 18),
      new Ship('S93', 20, 8, 37),
    ];
    this.shipIdx = 0;
    this.ship = this.ships[0];

    this.mpf = 1000 / 60;
    this.prevTs = 0;
    this.lag = 0;

    this.frame(0);
  },

  nextShip() {
    if (this.shipIdx == this.ships.length - 1) {
      this.shipIdx = 0;
    } else {
      this.shipIdx++;
    }
    this.ship = this.ships[this.shipIdx];
  },

  prevShip() {
    if (this.shipIdx == 0) {
      this.shipIdx = this.ships.length - 1;
    } else {
      this.shipIdx--;
    }
    this.ship = this.ships[this.shipIdx]
  },

  frame(ts: number) {
    requestAnimationFrame(this.frame.bind(this));
    this.$.input.process();
    this.lag += ts - this.prevTs;
    while (this.lag >= this.mpf) {
      for (var i = 0; i < this.ships.length; i++) {
        this.ships[i].tick();
      }
      this.lag -= this.mpf;
    }
    this.$.map.draw();
    this.$.nav.draw();
    this.$.thrust.draw();
    this.$.power.draw();
  },
});
