import {Point} from './components';

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
