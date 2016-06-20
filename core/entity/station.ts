import {Resource} from '../resources';

import {Db} from './db';

export function SpawnStation(
    db: Db, name: string, x: number, y: number): string {
  const id = db.spawn();
  db.stations[id] = {produces: {}};
  const produces = db.stations[id].produces;
  produces[Resource.Missile] = 60;
  produces[Resource.Energy] = 1;
  if (!name) {
    name = 'Station ' + id;
  }
  db.names[id] = name;
  db.positions[id] = {x: x, y: y, yaw: 0, roll: 0};
  db.prevPositions[id] = {x: x, y: y, yaw: 0, roll: 0};
  db.collidables[id] = {length: 300, width: 300, mass: 1000, damage: 10};
  db.healths[id] = {hp: 1000, shields: true};
  db.resources[id] = {};
  console.log('entity.station: spawned station', id, name);
  return id;
}
