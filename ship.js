'use strict';

class Ship {
  constructor(name, x, y, heading) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.thrust = 0;
  }

  tick() {
    var rads = radians(this.heading - 90);
    this.x += this.thrust * Math.cos(rads);
    this.y += this.thrust * Math.sin(rads);
  }
}
