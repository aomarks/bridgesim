import {Db} from './db';

export function SpawnMissile(
    db: Db, origin: string, x: number, y: number, yaw: number, range: number) {
  const res = db.resources[origin];
  if (res) {
    if (res.missile <= 0) {
      return undefined;
    }
    res.missile--;
  }

  const id = db.spawn();
  const missile = db.newMissile(id);
  missile.range = range;
  const pos = db.newPosition(id);
  pos.x = x;
  pos.y = y;
  pos.yaw = yaw;
  const mot = db.newMotion(id);
  const originMot = db.motion[origin];
  mot.thrust = 5;
  mot.velocityX = originMot.velocityX;
  mot.velocityY = originMot.velocityY;
  db.newOdometer(id);
  db.newHealth(id).hp = 1;
  const col = db.newCollidable(id);
  col.length = 1000;
  col.width = 1000;
  col.damage = 20;
  col.ignore = origin;
  console.log('entity.missile: spawned missile', id);
  return id;
}
