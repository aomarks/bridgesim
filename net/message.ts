namespace Bridgesim.Net {

  export interface Message {
    seq?: number;

    hello?: Hello;
    welcome?: Welcome;
    playerList?: PlayerList;
    sendChat?: SendChat;
    receiveChat?: ReceiveChat;
    update?: Update;
    sync?: Sync;
  }

  export interface Hello { name: string; }

  export interface Welcome {
    clientId: number;
    shipId: number;
    updates: Update[];
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

  export interface Update {
    shipId?: number;
    x: number;
    y: number;
    heading: number;
    thrust: number;
  }

  export interface Sync { updates: Update[] }
}
