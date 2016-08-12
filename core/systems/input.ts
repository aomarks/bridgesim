import * as Components from '../components';
import * as Net from '../../net/message';
import {Db} from '../entity/db';
import {SpawnLaser} from '../entity/laser';
import {SpawnMissile} from '../entity/missile';
import {clamp} from '../math';

const MAX_TURN_SPEED = 5;  // Degrees per tick.

const MAX_POWER = 1.5;

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

    let spare = MAX_POWER;
    for (let sys of Components.Power.prototype.props) {
      spare -= power[sys];
    }

    for (let sys in input.power) {
      let delta = input.power[sys];
      const cur = power[sys];
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
      if (input.fireLaser) {
        SpawnLaser(this.db, id, pos.x, pos.y, input.fireLaser);
      }

      const resources = this.db.resources[id];
      if (input.fireMissile && resources.missile > 0) {
        SpawnMissile(this.db, id, pos.x, pos.y, pos.yaw);
        resources.missile--;
      }
    }

    if (health && input.toggleShield) {
      health.shields = !health.shields;
    }
  }
}
