///<reference path="db.ts" />

namespace Bridgesim.Core.Entity {

  export function SpawnDebris(db: Db, x: number, y: number): string {
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

  export function SpawnAstroidBelt(db: Db, x1: number, y1: number, x2: number, y2: number) {
    const fuzz = 0.5;
    const density = 5;
    const xdist = x2-x1;
    const ydist = y2-y1;
    const dist = Math.sqrt(xdist*xdist + ydist*ydist);
    const steps = dist*density;
    const xstep = xdist/steps;
    const ystep = ydist/steps;
    for (let i=0; i < steps; i++) {
      SpawnDebris(db, x1+xstep*i+Math.random()*fuzz, y1+ystep*i+Math.random()*fuzz);
    }
  }
}
