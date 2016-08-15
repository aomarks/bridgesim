import * as Net from '../../net/message';
import * as Components from '../components';
import {Db} from '../entity/db';
import {fireWeapon} from '../weapon';


const MAX_TURN_SPEED = 5;  // Degrees per tick.

const MAX_POWER_PER_SYSTEM = 0.75;

// Applies player input.
export class Input {
  constructor(private db: Db) {}

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
    const motion = this.db.motion[id];
    const power = this.db.power[id];
    const health = this.db.healths[id];

    if (power != null) {
      const MAX_POWER = Object.keys(Components.Power.prototype.props).length *
          MAX_POWER_PER_SYSTEM;
      let spare = MAX_POWER;
      for (let sys of Components.Power.prototype.props) {
        spare -= power[sys];
      }

      for (let sys in input.power) {
        const cur = power[sys];
        let delta = input.power[sys] - cur;
        if (delta > spare) {
          delta = spare;
        }
        if (cur + delta > 1) {
          delta = 1 - cur;
        }
        if (cur + delta < 0) {
          delta = -cur;
        }
        power[sys] += delta;
        spare -= delta;
      }
    }

    if (motion != null) {
      motion.thrust = input.thrust;
    }

    if (pos != null) {
      // TODO Move to motion system. Should systems process their own input?
      const delta = MAX_TURN_SPEED * input.turn * power.maneuvering;
      if (prevPos) {
        prevPos.yaw = pos.yaw;
        prevPos.roll = pos.roll;
      }
      pos.yaw += delta;
      pos.roll -= (delta / 180 * Math.PI / 2);
    }

    if (spawn && pos) {
      for (let e of input.fireWeapons) {
        const heading = e.heading;
        fireWeapon(this.db, id, e.weapon, heading);
      }
    }

    if (health && input.toggleShield) {
      health.shieldsUp = !health.shieldsUp;
    }
  }
}
