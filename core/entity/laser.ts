import {Db} from "./db";
import {Resource} from "../resources";

export function SpawnLaser(
    db: Db, origin: string, x: number, y: number, yaw: number) {
  const id = db.spawn();
  db.lasers[id] = true;
  db.positions[id] = {x: x, y: y, yaw: yaw, roll: 0};
  db.prevPositions[id] = {x: x, y: y, yaw: yaw, roll: 0};
  db.velocities[id] = 1;
  db.odometers[id] = 0;
  db.healths[id] = {hp: 0, shields: false};
  db.collidables[id] =
      {length: 10, width: 10, mass: 0, damage: 1, ignore: origin};
  db.resources[origin][Resource.Energy] -= 10;
  console.log('entity.laser: spawned laser', id);
  return id;
}
