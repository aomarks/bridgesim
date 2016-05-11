///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as Net from "../net/message";
import {Db} from "../core/entity/db";
import {Player} from "../core/components";

@component('bridgesim-lobby')
class Lobby extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: Array}) stations: Net.Station[];

  ready(): void {
    this.stations = [
      Net.Station.Helm,
      Net.Station.Comms,
      Net.Station.Science,
      Net.Station.Weapons,
      Net.Station.Engineering,
    ];
  }

  private createShip(): void { this.fire('create-ship', <Net.CreateShip>{}); }

  private joinCrew(e: any) {
    const shipId = this.$.ships.modelForElement(e.target).shipId;
    const station = e.model.station;
    this.fire('join-crew', <Net.JoinCrew>{shipId: shipId, station: station});
  }

  private shipIds(ships: {[id: string]: any}): string[] {
    const ids = Object.keys(ships);
    ids.sort();
    return ids;
  }

  private isHuman(shipId: string): boolean { return !this.db.ais[shipId]; }

  private shipName(names: {[id: string]: string}, id: string): string {
    return names[id] || '';
  }

  private stationName(station: Net.Station): string {
    return Net.Station[station];
  };

  private assigned(
      players: {[id: string]: Player}, shipId: string,
      station: Net.Station): boolean {
    return !!this.playerFromStation(players, shipId, station);
  }

  private playerName(
      players: {[id: string]: Player}, shipId: string,
      station: Net.Station): string {
    const player = this.playerFromStation(players, shipId, station);
    return player ? player.name : '';
  }

  private playerFromStation(
      players: {[id: string]: Player}, shipId: string,
      station: Net.Station): Player {
    for (let playerId in players) {
      const player = players[playerId];
      if (player.shipId === shipId && player.station === station) {
        return player;
      }
    }
    return;
  }
}
Lobby.register();
