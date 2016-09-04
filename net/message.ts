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
  updateSettings?: UpdateSettings;
}

export enum Station {
  Helm,
  Comms,
  Science,
  Weapons,
  Engineering,
}

/**
 * Hello is sent from client to host upon first connecting.
 */
export interface Hello {
  name: string;
  forceStation?: Station;
}

/**
 * Welcome is sent from host to client in response to a Hello.
 */
export interface Welcome {
  playerId: string;
  snapshot: Update;
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
  spoolJump?: Components.Point;
  abortJump?: boolean;
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

export interface UpdateSettings {
  scenarioName?: string;
  started?: boolean
}
