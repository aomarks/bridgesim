///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-chat')
  export class Chat extends polymer.Base {
    private input: HTMLElement;
    private text: string;
    private log: Net.ReceiveChat[];

    ready(): void {
      this.input = this.$.input;
      this.log = [];
    }

    send(): void {
      this.fire('send-chat', {text: this.text});
      this.text = '';
    }

    receiveMsg(chat: Net.ReceiveChat): void { this.unshift('log', chat); }
  }
  Chat.register();
}
