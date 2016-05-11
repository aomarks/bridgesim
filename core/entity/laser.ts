import {Db} from "./db";

export function SpawnLaser(
    db: Db, origin: string, x: number, y: number, yaw: number) {
  const id = db.spawn();
  db.lasers[id] = true;
  db.positions[id] = {x: x, y: y, yaw: yaw, roll: 0};
  db.prevPositions[id] = {x: x, y: y, yaw: yaw, roll: 0};
  db.velocities[id] = .5;
  db.odometers[id] = 0;
  db.healths[id] = {hp: 0, shields: false};
  db.collidables[id] =
      {length: .2, width: .2, mass: 0, damage: 1, ignore: origin};
  console.log('entity.laser: spawned laser', id);
  return id;
}
