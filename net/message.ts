import {Update} from '../core/comdb';
import * as Components from '../core/components';

export interface Message {
  hello?: Hello;
  welcome?: Welcome;
  sendChat?: SendChat;
  receiveChat?: ReceiveChat;
  commands?: Commands;
  createShip?: CreateShip;
  joinCrew?: JoinCrew;
  updatePlayer?: UpdatePlayer;
  update?: Update;
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
  playerId?: string;
  snapshot: Update;
  updateInterval?: number;
  tickInterval?: number;
  galaxySize?: number;
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
  turn?: number;
  thrust?: number;
  power?: Components.Power;
  fireLaser?: number;
  fireMissile?: boolean;
  toggleShield?: boolean;
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
