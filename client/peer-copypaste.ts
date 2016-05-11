///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />

import {WebRTCConnection, encodeRSD, decodeRSD} from "../net/webrtc";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
};

@component('bridgesim-peer-copypaste')
class PeerCopypaste extends polymer.Base {
  private copyOffer: string;
  private copyAnswer: string;
  private pasteOffer: string;
  private pasteAnswer: string;
  private conn: WebRTCConnection;

  openClientDialog(): void {
    this.$.clientDialog.open();
    this.conn = new WebRTCConnection(RTC_CONFIG);
    this.conn.onOpen = () => {
      this.conn.onOpen = null;
      this.fire('connection', this.conn);
      this.$.clientDialog.close();
    };
    this.conn.makeOffer().then(offer => { this.copyOffer = encodeRSD(offer); });
  }

  connect(e: any): void {
    const id = e.model.item.ID;
    let password = '';
    if (e.model.item.RequiresPassword) {
      password = prompt('Server Password');
    }
    const lobbyList = (this.querySelector('#lobbyList') as any);
    lobbyList.connect(id, this.copyOffer, password)
        .then((resp: {Answer: string}) => { this.pasteAnswer = resp.Answer; });
  }

  refreshList(): void { (this.querySelector('#lobbyList') as any).refresh(); }

  openHostDialog(): void { this.$.hostDialog.open(); }

  @observe('pasteOffer')
  onPasteOffer(offer: string): void {
    if (!offer) {
      return;
    }
    this.handleOffer(offer);
  }

  handleOffer(offer: string): Promise<string> {
    const conn = new WebRTCConnection(RTC_CONFIG);
    conn.onOpen = () => {
      conn.onOpen = null;
      this.fire('connection', conn);
      this.$.hostDialog.close();
    };
    return conn.takeOffer(decodeRSD(offer)).then(answer => {
      this.copyAnswer = encodeRSD(answer);
      return this.copyAnswer;
    });
  }

  @observe('pasteAnswer')
  onPasteAnswer(answer: string): void {
    if (!answer) {
      return;
    }
    this.conn.takeAnswer(decodeRSD(answer));
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
