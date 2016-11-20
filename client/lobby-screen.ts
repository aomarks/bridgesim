///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />


import {Name, Player} from '../core/components';
import {Db} from '../core/entity/db';
import * as Net from '../net/message';
import {Scenario} from '../scenarios/scenarios';

interface Ship {
  id: string;
  name: string;
  stations: Station[];
}

interface Station {
  id: Net.Station;
  name: string;
  playerName: string;
}

const STATION_IDS = [
  Net.Station.Helm,
  Net.Station.Comms,
  Net.Station.Science,
  Net.Station.Weapons,
  Net.Station.Engineering,
];

@component('bridgesim-lobby-screen')
class LobbyScreen extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: Boolean, value: false}) hosting: boolean;
  @property({type: String}) token: string;
  @property({type: String, notify: true}) serverName: string;
  @property({type: String}) scenarioName: string;
  @property({type: Array}) ships: Ship[];
  @property({type: String, value: null}) newShipName: string;

  private createShip() {
    this.fire('net-send', <Net.Message>{
      createShip: {
        name: this.newShipName,
      },
    });
    this.newShipName = null;
  }

  private claimStation(e: any) {
    const ship: Ship = this.$.ships.modelForElement(e.target).ship;
    const station: Station = e.model.station;
    this.fire('net-send', <Net.Message>{
      joinCrew: {
        shipId: ship.id,
        station: station.id,
      },
    });
  }

  private start() {
    this.fire('net-send', <Net.Message>{
      updateSettings: {started: true},
    });
  }

  @observe('db.ships.*, db.players.*, db.ais.*, db.names.*')
  private recompute() {
    // Map from shipId -> stationId -> playerId.
    const crews = {};
    for (const playerId in this.db.players) {
      const player = this.db.players[playerId];
      if (player.shipId == null) {
        continue;
      }
      if (!crews[player.shipId]) {
        crews[player.shipId] = {};
      }
      crews[player.shipId][player.station] = playerId;
    }

    const ships = [];
    for (const shipId in this.db.ships) {
      if (this.db.ais[shipId]) {
        continue;
      }
      const stations = [];
      for (const stationId of STATION_IDS) {
        const playerId = (crews[shipId] || {})[stationId];
        const playerName =
            playerId == null ? null : this.db.players[playerId].name;
        stations.push({
          id: stationId,
          name: Net.Station[stationId],
          playerName: playerName,
        });
      }
      ships.push({
        id: shipId,
        name: this.db.names[shipId].name,
        stations: stations,
      });
    }

    this.ships = ships;
  }

  private tokenURL(token: string): string {
    return window.location.origin + window.location.pathname + '#' + token;
  }
}
LobbyScreen.register();
