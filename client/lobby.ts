///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-lobby')
  class Lobby extends polymer.Base {
    @property({type: Object}) roster: Net.Roster;

    private createShip() { this.fire('create-ship', <Net.CreateShip>{}); }

    private joinCrew(e: any) {
      const shipId = this.$.ships.modelForElement(e.target).ship.id;
      const station = e.model.assignment.station;
      this.fire('join-crew', <Net.JoinCrew>{shipId: shipId, station: station});
    }

    private assigned(assignment: Net.Assignment): boolean {
      return assignment.playerId != null;
    }

    private stationName(station: Net.Station): string {
      return Net.Station[station];
    }
  }
  Lobby.register();
}
