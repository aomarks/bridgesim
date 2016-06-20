import {Db} from './db';

export function SpawnMissile(
    db: Db, origin: string, x: number, y: number, yaw: number) {
  const id = db.spawn();
  db.missiles[id] = true;
  db.positions[id] = {x: x, y: y, yaw: yaw, roll: 0};
  db.prevPositions[id] = {x: x, y: y, yaw: yaw, roll: 0};
  db.velocities[id] = .5;
  db.odometers[id] = 0;
  db.healths[id] = {hp: 1, shields: false};
  db.collidables[id] =
      {length: 1000, width: 1000, mass: 0, damage: 20, ignore: origin};
  console.log('entity.missile: spawned missile', id);
  return id;
}
