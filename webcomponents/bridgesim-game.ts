///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../engine/ship.ts" />

@component('bridgesim-game')
class BridgesimGame extends polymer.Base {
  @property({type: Number, value: 60}) size: number;

  private ship: Ship;
  private ships: Ship[] = [];
  private shipIdx: number = 0;
  private mpf: number = 1000 / 60;
  private prevTs: number = 0;
  private lag: number = 0;

  ready(): void {
    this.ships = [
      new Ship('P28', 30, 30, 0),
      new Ship('A19', 18, 2, 18),
      new Ship('S93', 20, 8, 37),
    ];
    this.ship = this.ships[0];
    this.frame(0);
  }

  nextShip(): void {
    if (this.shipIdx == this.ships.length - 1) {
      this.shipIdx = 0;
    } else {
      this.shipIdx++;
    }
    this.ship = this.ships[this.shipIdx];
  }

  prevShip(): void {
    if (this.shipIdx == 0) {
      this.shipIdx = this.ships.length - 1;
    } else {
      this.shipIdx--;
    }
    this.ship = this.ships[this.shipIdx]
  }

  frame(ts: number): void {
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
  }
}
BridgesimGame.register();
