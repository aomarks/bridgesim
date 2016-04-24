///<reference path="util.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Core {

  export class Ship {
    prevX: number;
    prevY: number;
    roll: number = 0;
    thrust: number;
    shieldEnabled: boolean = false;
    engine: Subsystem;
    maneuvering: Subsystem;
    weapons: Subsystem;
    subsystems: Subsystem[];
    curSubsystem: number;
    crew: Net.Assignment[] = [
      {station: Net.Station.Helm},
      {station: Net.Station.Comms},
      {station: Net.Station.Science},
      {station: Net.Station.Weapons},
      {station: Net.Station.Engineering},
    ];

    constructor(public id: number, public name: string, public x: number,
                public y: number, public heading: number) {
      this.prevX = x;
      this.prevY = y;
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

    findAssignment(station: Net.Station): Net.Assignment {
      // TODO Probably should have a station -> player map instead.
      for (let assignment of this.crew) {
        if (assignment.station == station) {
          return assignment;
        }
      }
      return null;
    }

    applyCommands(commands: Net.Commands): void {
      this.applyYaw(commands.yaw);
      this.applyThrust(commands.thrust);
      this.applyPower(commands.power);
    }

    setPos(x: number, y: number): void {
      this.prevX = this.x;
      this.prevY = this.y;
      this.x = x;
      this.y = y;
    }

    tick(): void {
      let rads = radians(this.heading - 90);
      let t = Math.pow(this.thrust, 2);
      this.setPos(this.x + (t * Math.cos(rads)), this.y + (t * Math.sin(rads)));
      this.roll *= 0.95;
    }

    applyYaw(amount: number): void {
      const delta = (this.maneuvering.level / 20) * amount;
      this.heading += delta;
      this.roll -= delta/180*Math.PI/2;
    }

    applyThrust(amount: number): void {
      this.thrust = Math.min(1, Math.max(0, this.thrust + (.01 * amount)));
    }

    applyPower(amount: number): void {
      const s = this.subsystems[this.curSubsystem];
      s.level = Math.min(100, Math.max(0, s.level + amount));
    }
  }

  export class Subsystem {
    level: number;
    coolant: number;

    constructor(public name: string) {
      this.level = 100;
      this.coolant = 0;
    }
  }
}
