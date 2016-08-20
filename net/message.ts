import {Update} from '../core/comdb';
import * as Components from '../core/components';
import {FireWeapon} from '../core/weapon';

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
  startGame?: StartGame;
}

export enum Station {
  Helm,
  Comms,
  Science,
  Weapons,
  Engineering,
}

export interface Hello {
  name: string;
  forceStation?: Station;
}

export interface Welcome {
  playerId?: string;
  snapshot: Update;
  updateInterval?: number;
  tickInterval?: number;
  galaxySize?: number;
  started?: boolean;
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
  toggleShield?: boolean;
  fireWeapons?: FireWeapon[];
}

export interface CreateShip { name: string; }

export interface JoinCrew {
  shipId: string;
  station: Station;
}

export interface UpdatePlayer {
  playerId?: string;
  name?: string;
}

export interface StartGame {}
