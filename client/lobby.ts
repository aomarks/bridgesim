///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../core/entity/db.ts" />
///<reference path="../core/components.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-lobby')
  class Lobby extends polymer.Base {
    @property({type: Object}) db: Core.Entity.Db;
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

    private shipName(names: {[id: string]: string}, id: string): string {
      return names[id] || '';
    }

    private stationName(station: Net.Station): string {
      return Net.Station[station];
    };

    private assigned(players: {[id: string]: Core.Components.Player},
                     shipId: string, station: Net.Station): boolean {
      for (let playerId in players) {
        const player = players[playerId];
        if (player.shipId === shipId && player.station === station) {
          return true;
        }
      }
      return false;
    }
  }
  Lobby.register();
}
