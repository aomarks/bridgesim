///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-lobby')
  export class Lobby extends polymer.Base {
    private chatBox: HTMLElement;
    private chatMsg: string;
    private msgBuffer: string[];

    ready(): void {
      this.chatBox = this.$.chatBox;
      this.msgBuffer = [];
    }

    sendChat(): void {
      this.fire('send-chat', {msg: this.chatMsg});
      this.chatMsg = '';
    }

    receiveMsg(msg): void { this.push('msgBuffer', msg.msg); }
  }
  Lobby.register();
}
