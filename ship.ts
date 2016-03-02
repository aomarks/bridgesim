///<reference path="util.ts" />

class Ship {
  name;
  x;
  y;
  heading;
  thrust;
  engine;
  maneuvering;
  weapons;
  subsystems: Subsystem[];
  curSubsystem;

  constructor(name, x, y, heading) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.thrust = 0;

    this.engine = new Subsystem('engine');
    this.maneuvering = new Subsystem('maneuvering');
    this.weapons = new Subsystem('weapons');

    this.subsystems = [
      this.engine,
      this.maneuvering,
      this.weapons,
    ];

    this.curSubsystem = 0;
  }

  tick() {
    let rads = radians(this.heading - 90);
    let t = Math.pow(this.thrust, 2);
    this.x += t * Math.cos(rads);
    this.y += t * Math.sin(rads);
  }

  turnLeft() { this.heading -= this.maneuvering.level / 20; }

  turnRight() { this.heading += this.maneuvering.level / 20; }

  thrustUp() {
    this.thrust += .01;
    if (this.thrust > 1) {
      this.thrust = 1;
    }
  }

  thrustDown() {
    this.thrust -= .01;
    if (this.thrust < 0) {
      this.thrust = 0;
    }
  }

  powerUp() {
    let s = this.subsystems[this.curSubsystem];
    s.level += 1;
    if (s.level > 100) {
      s.level = 100;
    }
  }

  powerDown() {
    let s = this.subsystems[this.curSubsystem];
    s.level -= 1;
    if (s.level < 0) {
      s.level = 0;
    }
  }
}

class Subsystem {
  name;
  level;
  coolant;

  constructor(name) {
    this.name = name;
    this.level = 100;
    this.coolant = 0;
  }
}
