///<reference path="../components.ts" />
///<reference path="../../net/message.ts" />

namespace Bridgesim.Core.Entity {

  // Database of entity components.
  export class Db {
    private nextId: number = 0;

    ais: {[id: string]: boolean} = {};
    collidables: {[id: string]: Components.Collidable} = {};
    healths: {[id: string]: Components.Health} = {};
    inputs: {[id: string]: Net.Commands[]} = {};
    lasers: {[id: string]: boolean} = {};
    names: {[id: string]: string} = {};
    odometers: {[id: string]: number} = {};
    players: {[id: string]: Components.Player} = {};
    positions: {[id: string]: Components.Position} = {};
    power: {[id: string]: Components.Power} = {};
    prevPositions: {[id: string]: Components.Position} = {};
    ships: {[id: string]: boolean} = {};
    velocities: {[id: string]: number} = {};

    spawn(): string { return (this.nextId++).toString(); }

    remove(id: string): void {
      delete this.ais[id];
      delete this.collidables[id];
      delete this.healths[id];
      delete this.inputs[id];
      delete this.lasers[id];
      delete this.names[id];
      delete this.odometers[id];
      delete this.players[id];
      delete this.positions[id];
      delete this.power[id];
      delete this.prevPositions[id];
      delete this.ships[id];
      delete this.velocities[id];
    }
  }
}
