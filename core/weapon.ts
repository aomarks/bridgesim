import {Point} from './components';
import {Db} from './entity/db';
import {SpawnLaser} from './entity/laser';
import {SpawnMissile} from './entity/missile';
import {degrees} from './math';

export enum WeaponType {
  Laser = 1,
  Missile,
}

export interface Weapon {
  type: WeaponType;
  range: number;
  direction: number;
  angle: number;
  damage?: number;
}

export interface FireWeapon {
  heading: number;
  target: Point;
  weapon: Weapon;
}

// fireWeapon returns true if the weapon was fired. Only won't fire if the
// weapon can't aim that way or doesn't have any of the required resource.
export function fireWeapon(
    db: Db, id: string, w: Weapon, heading: number): boolean {
  const pos = db.positions[id];
  const {angle, range, type, damage, direction} = w;
  const angleDeg = degrees(angle) / 2;
  const diff = Math.abs(
      (pos.yaw + degrees(direction) - heading + 180 + 360) % 360 - 180);
  if (diff > angleDeg) {
    return false;
  }

  const resources = db.resources[id];
  if (type === WeaponType.Laser) {
    return !!SpawnLaser(db, id, pos.x, pos.y, heading, range, damage);
  } else if (type == WeaponType.Missile) {
    return !!SpawnMissile(db, id, pos.x, pos.y, heading, range);
  }
  return false;
}
