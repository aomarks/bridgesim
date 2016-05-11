import * as Components from "../core/components";

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
  updatePlayer?: UpdatePlayer;
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
  players: {[id: string]: Components.Player};
  ais: {[id: string]: boolean};
}

export interface SendChat { text: string; }

export interface ReceiveChat {
  timestamp: number;
  playerId?: string;
  name?: string;
  announce?: boolean;
  text: string;
}

export interface Commands {
  seq?: number;
  turn: number;
  thrust: number;
  power: Components.Power;
  fireLaser: boolean;
  fireMissile: boolean;
}

export interface Snapshot {
  seq: number;
  lasers: {[id: string]: boolean};
  missiles: {[id: string]: boolean};
  positions: {[id: string]: Components.Position};
  velocities: {[id: string]: number};
  healths: {[id: string]: Components.Health};
  power: {[id: string]: Components.Power};
  debris: {[id: string]: Components.Debris};
  stations: {[id: string]: Components.Station};
}

export interface CreateShip {}

export interface JoinCrew {
  shipId: string;
  station: Station;
}

export interface UpdatePlayer {
  playerId?: string;
  name?: string;
}
