///<reference path="../components.ts" />
///<reference path="../entity/db.ts" />
///<reference path="../entity/laser.ts" />
///<reference path="../../net/message.ts" />

namespace Bridgesim.Core.Systems {

  // Applies player input.
  export class Input {
    constructor(private db: Entity.Db) {}

    tick(): void {
      for (var id in this.db.inputs) {
        const inputs = this.db.inputs[id];
        while (inputs.length > 0) {
          this.apply(id, inputs.shift(), true);
        }
      }
    }

    apply(id: string, input: Net.Commands, spawn: boolean): void {
      const pos = this.db.positions[id];
      const prevPos = this.db.prevPositions[id];
      const velocity = this.db.velocities[id];
      const power = this.db.power[id];

      for (let sys in input.power) {
        const delta = input.power[sys];
        if (delta) {
          power[sys] = Math.min(100, Math.max(0, power[sys] + delta));
        }
      }

      if (velocity != null) {
        this.db.velocities[id] =
            Math.min(1, Math.max(0, velocity + (.01 * input.thrust)));
      }

      if (pos != null) {
        const delta = (power.maneuvering / 20) * input.turn;
        if (prevPos) {
          prevPos.yaw = pos.yaw;
          prevPos.roll = pos.roll;
        }
        pos.yaw += delta;
        pos.roll -= (delta / 180 * Math.PI / 2);
      }

      if (input.fire && pos && spawn) {
        Entity.SpawnLaser(this.db, id, pos.x, pos.y, pos.yaw);
      }
    }
  }
}
