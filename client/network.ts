namespace Bridgesim.Client.Net {

  export function pack(msg: Msg): string { return JSON.stringify(msg); }
  export function unpack(msg: string): Msg { return JSON.parse(msg); }

  export enum Type {Hello, Welcome, SendChat, ReceiveChat, Update, Sync}

  export interface Msg {
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
  }

  export interface Sync { updates: Update[] }
}
