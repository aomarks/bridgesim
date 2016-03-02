///<reference path="util.ts" />

class Ship {
  thrust: number;
  engine: Subsystem;
  maneuvering: Subsystem;
  weapons: Subsystem;
  subsystems: Subsystem[];
  curSubsystem: number;

  constructor(public name: string, public x: number, public y: number,
              public heading: number) {
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

  tick(): void {
    let rads = radians(this.heading - 90);
    let t = Math.pow(this.thrust, 2);
    this.x += t * Math.cos(rads);
    this.y += t * Math.sin(rads);
  }

  turnLeft(): void { this.heading -= this.maneuvering.level / 20; }

  turnRight(): void { this.heading += this.maneuvering.level / 20; }

  thrustUp(): void {
    this.thrust += .01;
    if (this.thrust > 1) {
      this.thrust = 1;
    }
  }

  thrustDown(): void {
    this.thrust -= .01;
    if (this.thrust < 0) {
      this.thrust = 0;
    }
  }

  powerUp(): void {
    let s = this.subsystems[this.curSubsystem];
    s.level += 1;
    if (s.level > 100) {
      s.level = 100;
    }
  }

  powerDown(): void {
    let s = this.subsystems[this.curSubsystem];
    s.level -= 1;
    if (s.level < 0) {
      s.level = 0;
    }
  }
}

class Subsystem {
  level: number;
  coolant: number;

  constructor(public name: string) {
    this.level = 100;
    this.coolant = 0;
  }
}
