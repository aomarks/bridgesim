namespace Bridgesim.Net {

  export enum Type {Hello, Welcome, SendChat, ReceiveChat, Update, Sync}

  export interface Message {
    type: Type;
    hello?: Hello;
    welcome?: Welcome;
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

  export interface SendChat { text: string; }

  export interface ReceiveChat {
    timestamp: number;
    clientId: number;
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
