import {Db} from './db';

export function SpawnShip(
    db: Db, name: string, x: number, y: number, ai: boolean,
    friendliness: number = 0): string {
  const id = db.spawn();
  db.newShip(id);
  if (!name) {
    name = 'S' + id;
  }
  const dbName = db.newName(id);
  dbName.name = name;
  const pos = db.newPosition(id);
  pos.x = x;
  pos.y = y;
  pos.yaw = 120;
  db.newMotion(id);
  db.inputs[id] = [];
  const col = db.newCollidable(id);
  col.length = 300;
  col.width = 300;
  col.mass = 10;
  col.damage = 10;
  const hel = db.newHealth(id);
  hel.hp = 100;
  hel.shields = true;
  const power = db.newPower(id);
  power.engine = 100;
  power.maneuvering = 100;
  const res = db.newResources(id);
  res.energy = 1000;
  res.missile = 2;
  if (ai) {
    const ai = db.newAi(id);
    ai.friendliness = friendliness;
  }
  console.log('entity.ship: spawned ship', id, name);
  return id;
}
