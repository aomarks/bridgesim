import {Db} from './db';

export function SpawnLaser(
    db: Db, origin: string, x: number, y: number, yaw: number) {
  const id = db.spawn();
  db.newLaser(id);
  const pos = db.newPosition(id);
  pos.x = x;
  pos.y = y;
  pos.yaw = yaw;
  db.newVelocity(id).mps = 1;
  db.newOdometer(id);
  db.newHealth(id).hp = 1;
  const col = db.newCollidable(id);
  col.length = 10;
  col.width = 10;
  col.damage = 1;
  col.ignore = origin;
  db.resources[origin].energy -= 10;
  // console.log('entity.laser: spawned laser', id);
  return id;
}
