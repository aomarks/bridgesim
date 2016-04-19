namespace Bridgesim.Net {

  export interface Message {
    hello?: Hello;
    welcome?: Welcome;
    playerList?: PlayerList;
    sendChat?: SendChat;
    receiveChat?: ReceiveChat;
    commands?: Commands;
    snapshot?: Snapshot;
  }

  export interface Hello { name: string; }

  export interface Welcome {
    clientId: number;
    shipId: number;
    snapshot: Snapshot;
    snapshotInterval: number;
  }

  export interface PlayerList { players: Player[]; }

  export interface Player {
    id: number;
    name: string;
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
}
