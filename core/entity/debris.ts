import {DebrisType} from '../components';
import {randInt} from '../math';

import {Db} from './db';

const MIN_DEBRIS_METERS = 1000;
const MAX_DEBRIS_METERS = 100;

export function SpawnDebris(db: Db, x: number, y: number): string {
  const id = db.spawn();
  const yaw = Math.random() * 360;
  const roll = Math.random() * 360;
  const size = randInt(MIN_DEBRIS_METERS, MAX_DEBRIS_METERS);
  db.positions[id] = {x: x, y: y, yaw: yaw, roll: roll};
  db.prevPositions[id] = {x: x, y: y, yaw: yaw, roll: roll};
  db.velocities[id] = 0;
  db.healths[id] = {hp: 10000, shields: false};
  db.collidables[id] = {length: size, width: size, mass: 10000, damage: 20};
  db.debris[id] = {type: DebrisType.ASTEROID};
  console.log('entity.debris: spawned debris', id);
  return id;
}

export function SpawnAstroidBelt(
    db: Db, x1: number, y1: number, x2: number, y2: number) {
  const fuzz = 5000;
  const density = .0005;
  const xdist = x2 - x1;
  const ydist = y2 - y1;
  const dist = Math.sqrt(xdist * xdist + ydist * ydist);
  const steps = dist * density;
  const xstep = xdist / steps;
  const ystep = ydist / steps;
  for (let i = 0; i < steps; i++) {
    SpawnDebris(
        db, x1 + xstep * i + Math.random() * fuzz,
        y1 + ystep * i + Math.random() * fuzz);
  }
};
