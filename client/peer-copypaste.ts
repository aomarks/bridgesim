///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {WebRTCConnection, decodeRSD, encodeRSD} from '../net/webrtc';

import {RTC_CONFIG} from './webrtc-config';

@component('bridgesim-peer-copypaste')
class PeerCopypaste extends polymer.Base {
  private copyOffer: string;
  private copyAnswer: string;
  private pasteOffer: string;
  private pasteAnswer: string;
  private hostID: string;
  private error: string = null;
  private connecting: boolean = false;
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
    this.lobbyListConnect(id, password);
  }

  onStopConnecting() { this.connecting = false; }

  lobbyListConnect(id: string, password: string = '') {
    this.error = null;
    this.connecting = true;
    const done = () => { this.connecting = false; };
    return this.$.lobbyList.connect(id, this.copyOffer, password)
        .then((resp: {Answer: string}) => { this.pasteAnswer = resp.Answer; })
        .catch((err) => { this.error = err; })
        .then(done, done);
  }

  connectByID(e: any): void { this.lobbyListConnect(this.hostID); }

  refreshList(): void { this.$.lobbyList.refresh(); }

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
