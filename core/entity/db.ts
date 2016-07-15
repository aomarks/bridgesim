import {Commands} from '../../net/message';
import {Database} from '../comdb';
import * as C from '../components';

export class Db extends Database {
  @Database.table(C.Ai) ais: {[id: string]: C.Ai} = {};
  newAi(id: string): C.Ai { return this['newAis_'](id); }

  @Database.table(C.Collidable) collidables: {[id: string]: C.Collidable} = {};
  newCollidable(id: string): C.Collidable {
    return this['newCollidables_'](id);
  }

  @Database.table(C.Debris) debris: {[id: string]: C.Debris} = {};
  newDebris(id: string): C.Debris { return this['newDebris_'](id); }

  @Database.table(C.Health) healths: {[id: string]: C.Health} = {};
  newHealth(id: string): C.Health { return this['newHealths_'](id); }

  @Database.table(C.Laser) lasers: {[id: string]: C.Laser} = {};
  newLaser(id: string): C.Laser { return this['newLasers_'](id); }

  @Database.table(C.Missile) missiles: {[id: string]: C.Missile} = {};
  newMissile(id: string): C.Missile { return this['newMissiles_'](id); }

  @Database.table(C.Name) names: {[id: string]: C.Name} = {};
  newName(id: string): C.Name { return this['newNames_'](id); }

  @Database.table(C.Odometer) odometers: {[id: string]: C.Odometer} = {};
  newOdometer(id: string): C.Odometer { return this['newOdometers_'](id); }

  @Database.table(C.Player) players: {[id: string]: C.Player} = {};
  newPlayer(id: string): C.Player { return this['newPlayers_'](id); }

  @Database.table(C.Position) positions: {[id: string]: C.Position} = {};
  newPosition(id: string): C.Position { return this['newPositions_'](id); }

  @Database.table(C.Power) power: {[id: string]: C.Power} = {};
  newPower(id: string): C.Power { return this['newPower_'](id); }

  @Database.table(C.Resources) resources: {[id: string]: C.Resources} = {};
  newResources(id: string): C.Resources { return this['newResources_'](id); }

  @Database.table(C.Ship) ships: {[id: string]: C.Ship} = {};
  newShip(id: string): C.Ship { return this['newShips_'](id); }

  @Database.table(C.Station) stations: {[id: string]: C.Station} = {};
  newStation(id: string): C.Station { return this['newStations_'](id); }

  @Database.table(C.Velocity) velocities: {[id: string]: C.Velocity} = {};
  newVelocity(id: string): C.Velocity { return this['newVelocities_'](id); }

  // Not synchronized.
  inputs: {[id: string]: Commands[]} = {};
  prevPositions: {[id: string]: C.Position} = {};
}
