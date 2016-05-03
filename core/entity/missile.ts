///<reference path="db.ts" />

namespace Bridgesim.Core.Entity {

  export function SpawnMissile(db: Db, origin: string, x: number, y: number,
                               yaw: number) {
    const id = db.spawn();
    db.missiles[id] = true;
    db.positions[id] = {x: x, y: y, yaw: yaw, roll: 0};
    db.prevPositions[id] = {x: x, y: y, yaw: yaw, roll: 0};
    db.velocities[id] = .1;
    db.odometers[id] = 0;
    db.healths[id] = {hp: 0, shields: false};
    db.collidables[id] =
        {length: 1, width: 1, mass: 0, damage: 20, ignore: origin};
    console.log('entity.missile: spawned missile', id);
    return id;
  }
}
