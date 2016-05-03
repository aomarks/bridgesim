///<reference path="../core/components.ts" />

namespace Bridgesim.Net {

  export interface Message {
    hello?: Hello;
    welcome?: Welcome;
    roster?: Roster;
    sendChat?: SendChat;
    receiveChat?: ReceiveChat;
    commands?: Commands;
    snapshot?: Snapshot;
    createShip?: CreateShip;
    joinCrew?: JoinCrew;
  }

  export enum Station {
    Helm,
    Comms,
    Science,
    Weapons,
    Engineering,
  }

  export interface Hello { name: string; }

  export interface Welcome {
    playerId: string;
    roster: Roster;
    snapshot: Snapshot;
    snapshotInterval: number;
    tickInterval: number;
  }

  export interface Roster {
    ships: {[id: string]: boolean};
    names: {[id: string]: string};
    players: {[id: string]: Core.Components.Player};
  }

  export interface SendChat { text: string; }

  export interface ReceiveChat {
    timestamp: number;
    playerId?: string;
    announce?: boolean;
    text: string;
  }

  export interface Commands {
    seq?: number;
    turn: number;
    thrust: number;
    power: Core.Components.Power;
    fireLaser: boolean;
    fireMissile: boolean;
  }

  export interface Snapshot {
    seq: number;
    lasers: {[id: string]: boolean};
    missiles: {[id: string]: boolean};
    positions: {[id: string]: Core.Components.Position};
    velocities: {[id: string]: number};
    healths: {[id: string]: Core.Components.Health};
    power: {[id: string]: Core.Components.Power};
  }

  export interface CreateShip {}

  export interface JoinCrew {
    shipId: string;
    station: Station;
  }
}
