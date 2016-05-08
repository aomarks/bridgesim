///<reference path="db.ts" />

namespace Bridgesim.Core.Entity {

  export function SpawnStation(db: Db, name: string, x: number, y: number): string {
    const id = db.spawn();
    db.stations[id] = {resources: {missile: 2, energy: 100}, produces: {missile: 60, energy: 0.5}};
    if (!name) {
      name = 'Station ' + id;
    }
    db.names[id] = name;
    db.positions[id] = {x: x, y: y, yaw: 0, roll: 0};
    db.prevPositions[id] = {x: x, y: y, yaw: 0, roll: 0};
    db.collidables[id] = {length: .03, width: .03, mass: 1000, damage: 10};
    db.healths[id] = {hp: 1000, shields: true};
    console.log('entity.station: spawned station', id, name);
    return id;
  }
}
