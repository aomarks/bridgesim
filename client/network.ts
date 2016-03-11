namespace Bridgesim.Client.Net {

  export function pack(msg: Msg): string { return JSON.stringify(msg); }
  export function unpack(msg: string): Msg { return JSON.parse(msg); }

  export interface Msg {
    type: Type;
    hi?: Hi;
    bye?: Bye;
    chat?: Chat;
  }

  export enum Type {Hi, Bye, Chat}
  ;

  export interface Hi { name: string; }

  export interface Bye { name: string; }

  export interface Chat {
    ts?: Number;
    id?: Number;
    text: string;
  }
}
