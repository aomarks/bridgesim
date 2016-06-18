import {Db} from "./db";
import {Resource} from "../resources";

export function SpawnShip(
    db: Db, name: string, x: number, y: number, ai: boolean): string {
  const id = db.spawn();
  db.ships[id] = true;
  if (!name) {
    name = 'S' + id;
  }
  db.names[id] = name;
  db.positions[id] = {x: x, y: y, yaw: 120, roll: 0};
  db.prevPositions[id] = {x: x, y: y, yaw: 120, roll: 0};
  db.velocities[id] = 0;
  db.inputs[id] = [];
  db.collidables[id] = {length: 300, width: 300, mass: 10, damage: 10};
  db.healths[id] = {hp: 100, shields: true};
  db.power[id] = {engine: 100, maneuvering: 100};
  const resources = db.resources[id] = {};
  resources[Resource.Energy] = 1000;
  console.log(name, ai);
  if (ai) {
    db.ais[id] = true;
  }
  console.log('entity.ship: spawned ship', id, name);
  return id;
}
