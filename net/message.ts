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
    clientId: number;
    snapshot: Snapshot;
    snapshotInterval: number;
    tickInterval: number;
  }

  export interface Roster {
    players: Player[];
    ships: Ship[]
  }

  export interface Player {
    id: number;
    name: string;
  }

  export interface Ship {
    id: number;
    name: string;
    crew: Assignment[];
  }

  export interface Assignment {
    station: Station;
    playerId?: number;
  }

  export interface SendChat { text: string; }

  export interface ReceiveChat {
    timestamp: number;
    clientId?: number;
    announce?: boolean;
    text: string;
  }

  export interface Commands {
    seq?: number;
    yaw: number;
    thrust: number;
    power: number;
  }

  export interface ShipState {
    shipId?: number;
    x: number;
    y: number;
    heading: number;
    thrust: number;
  }

  export interface Snapshot {
    seq: number;
    ships: ShipState[]
  }

  export interface CreateShip {}

  export interface JoinCrew {
    shipId: number;
    station: Station;
  }
}
