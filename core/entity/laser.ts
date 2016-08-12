import {Db} from './db';

// Energy consumed by one laser.
const LASER_ENERGY = 10;

export function SpawnLaser(
    db: Db, origin: string, x: number, y: number, yaw: number) {
  const res = db.resources[origin];
  if (res) {
    if (res.energy < LASER_ENERGY) {
      return;
    }
    res.energy -= LASER_ENERGY;
  }

  const id = db.spawn();
  db.newLaser(id);
  const pos = db.newPosition(id);
  pos.x = x;
  pos.y = y;
  pos.yaw = yaw;
  db.newMotion(id).thrust = 500;
  db.newOdometer(id);
  db.newHealth(id).hp = 1;
  const col = db.newCollidable(id);
  col.length = 10;
  col.width = 10;
  col.damage = 1;
  col.ignore = origin;
  // console.log('entity.laser: spawned laser', id);
  return id;
}
