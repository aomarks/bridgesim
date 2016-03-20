///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-lobby')
  export class Lobby extends polymer.Base {
    private chatBox: HTMLElement;
    private chatText: string;
    private chatLog: Net.ReceiveChat[];

    ready(): void {
      this.chatBox = this.$.chatBox;
      this.chatLog = [];
    }

    sendChat(): void {
      this.fire('send-chat', {text: this.chatText});
      this.chatText = '';
    }

    receiveMsg(chat: Net.ReceiveChat): void { this.unshift('chatLog', chat); }

    @listen('keydown')
    @listen('keyup')
    swallowKeyboardEvents(ev: KeyboardEvent): void {
      ev.cancelBubble = true;
    }

    focus(): void {
      (<HTMLInputElement>this.$$('input')).focus();
    }
  }
  Lobby.register();
}
