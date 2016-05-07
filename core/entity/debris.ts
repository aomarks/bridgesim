///<reference path="db.ts" />

namespace Bridgesim.Core.Entity {

  export function SpawnDebris(db: Db, x: number, y: number) {
    const id = db.spawn();
    const yaw = Math.random()*360;
    const roll = Math.random()*360;
    db.positions[id] = {x: x, y: y, yaw: yaw, roll: roll};
    db.prevPositions[id] = {x: x, y: y, yaw: yaw, roll: roll};
    db.velocities[id] = 0;
    db.healths[id] = {hp: 10000, shields: false};
    db.collidables[id] = {length: .2, width: .2, mass: 10000, damage: 20};
    db.debris[id] = {type: Components.DebrisType.ASTEROID};
    console.log('entity.debris: spawned debris', id);
    return id;
  }
}
