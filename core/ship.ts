///<reference path="body.ts" />
///<reference path="util.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Core {

  export class Ship {
    body: Body;
    size: number = .03;
    hp: number = 100;
    thrust: number = 0;
    shieldEnabled: boolean = false;
    engine: Subsystem;
    maneuvering: Subsystem;
    weapons: Subsystem;
    sensors: Subsystem;
    subsystems: Subsystem[];
    curSubsystem: number;
    crew: Net.Assignment[] = [
      {station: Net.Station.Helm},
      {station: Net.Station.Comms},
      {station: Net.Station.Science},
      {station: Net.Station.Weapons},
      {station: Net.Station.Engineering},
    ];

    constructor(public id: number, public name: string, x: number, y: number,
                yaw: number) {
      this.body = new Body(x, y, yaw, 0);
      this.engine = new Subsystem('engine');
      this.maneuvering = new Subsystem('maneuvering');
      this.weapons = new Subsystem('weapons');
      this.sensors = new Subsystem('sensors');
      this.subsystems = [
        this.engine,
        this.maneuvering,
        this.weapons,
        this.sensors,
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
      this.applyTurn(commands.turn);
      this.applyThrust(commands.thrust);
      this.applyPower(commands.power);
    }

    tick(): void {
      let rads = radians(this.body.yaw - 90);
      let t = Math.pow(this.thrust, 2);
      this.body.setX(this.body.x + (t * Math.cos(rads)));
      this.body.setY(this.body.y + (t * Math.sin(rads)));
      this.body.setRoll(this.body.roll * 0.95);
    }

    applyTurn(amount: number): void {
      const delta = (this.maneuvering.level / 20) * amount;
      this.body.setYaw(this.body.yaw + delta);
      this.body.setRoll(this.body.roll - (delta / 180 * Math.PI / 2));
    }

    applyThrust(amount: number): void {
      this.thrust = Math.min(1, Math.max(0, this.thrust + (.01 * amount)));
    }

    applyPower(amount: number): void {
      const s = this.subsystems[this.curSubsystem];
      s.level = Math.min(100, Math.max(0, s.level + amount));
    }

    giveDamage(): number { return 10; }

    takeDamage(dmg: number): void { this.hp = Math.max(0, this.hp - dmg); }
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
