///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../net/message.ts" />

namespace Bridgesim.Client {

  export interface ChatEvent { text: string }

  @component('bridgesim-chat')
  export class Chat extends polymer.Base {
    private input: HTMLElement;
    private text: string = '';
    private log: Net.ReceiveChat[];

    ready(): void {
      this.input = this.$.input;
      this.log = [];
    }

    send(): void {
      if (!this.text.trim()) {
        return;
      }
      this.fire('send-chat', <ChatEvent>{text: this.text});
      this.text = '';
    }

    receiveMsg(chat: Net.ReceiveChat): void { this.unshift('log', chat); }

    @listen('keydown')
    @listen('keyup')
    swallowKeyboardEvents(ev: KeyboardEvent): void {
      ev.cancelBubble = true;
    }

    focus(): void { this.input.focus(); }

    formatTimestamp(millis: number): string {
      const d = new Date(millis);
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' +
             pad(d.getSeconds());
    }
  }
  Chat.register();

  function pad(val: number): string { return ('0' + val).substr(-2); }
}
