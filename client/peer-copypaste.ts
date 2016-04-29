///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../net/webrtc.ts" />

namespace Bridgesim.Client {

  const RTC_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  @component('bridgesim-peer-copypaste')
  class PeerCopypaste extends polymer.Base {
    private copyOffer: string;
    private copyAnswer: string;
    private pasteOffer: string;
    private pasteAnswer: string;
    private conn: Net.WebRTCConnection;

    openClientDialog(): void {
      this.$.clientDialog.open();
      this.conn = new Net.WebRTCConnection(RTC_CONFIG);
      this.conn.onOpen = () => {
        this.conn.onOpen = null;
        this.fire('connection', this.conn);
        this.$.clientDialog.close();
      };
      this.conn.makeOffer().then(
          offer => { this.copyOffer = Net.encodeRSD(offer); });
    }

    openHostDialog(): void { this.$.hostDialog.open(); }

    @observe('pasteOffer')
    onPasteOffer(offer: string): void {
      if (!offer) {
        return;
      }
      const conn = new Net.WebRTCConnection(RTC_CONFIG);
      conn.onOpen = () => {
        conn.onOpen = null;
        this.fire('connection', conn);
        this.$.hostDialog.close();
      };
      conn.takeOffer(Net.decodeRSD(offer))
          .then(answer => { this.copyAnswer = Net.encodeRSD(answer); });
    }

    @observe('pasteAnswer')
    onPasteAnswer(answer: string): void {
      if (!answer) {
        return;
      }
      this.conn.takeAnswer(Net.decodeRSD(answer));
    }

    clear(): void {
      this.conn = null;
      this.copyOffer = '';
      this.copyAnswer = '';
      this.pasteOffer = '';
      this.pasteAnswer = '';
    }

    selectAndCopy(event: Event): void {
      (<HTMLTextAreaElement>event.target).select();
      document.execCommand('copy');
    }
  }
  PeerCopypaste.register();
}
