///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {WebRTCConnection, decodeRSD, encodeRSD} from '../net/webrtc';

import {RTC_CONFIG} from './webrtc-config';

interface handshake {
  offer: string;
  answer: string;
  accepted: boolean;
}

@component('bridgesim-peer-localstorage')
class PeerLocalstorage extends polymer.Base {
  @property({type: Boolean}) isHost: boolean;
  @property({type: Object}) handshakes: {[key: string]: handshake};
  @property({type: Object}) takeOffer: (string)=> Promise<string>;
  private key: string;
  private conn: WebRTCConnection;

  makeOffer(): void {
    if (this.isHost) {
      return;
    }
    this.key = Math.floor(Math.random() * 10000).toString();
    this.conn = new WebRTCConnection(RTC_CONFIG);
    this.conn.makeOffer().then(offer => {
      this.set('handshakes.' + this.key, {offer: encodeRSD(offer)});
      console.log('localstorage: sent offer', this.key);
    });
  }

  @observe('handshakes')
  onHandshakesChanged(): void {
    if (!this.handshakes) {
      this.handshakes = {};
      return;
    }
    if (this.isHost) {
      this.scanForOffers();
    } else if (this.key != null) {
      this.checkIfAccepted();
    }
  }

  scanForOffers(): void {
    for (let key in this.handshakes) {
      const handshake = this.handshakes[key];
      if (handshake.accepted) {
        continue;
      }
      console.log('localstorage: found offer', key);
      handshake.accepted = true;
      this.takeOffer(handshake.offer).then(answer => {
        this.set('handshakes.' + key + '.answer', answer);
        console.log('localstorage: set answer', key);
      });
    }
  }

  checkIfAccepted(): void {
    const handshake = this.handshakes[this.key];
    if (handshake && handshake.answer) {
      console.log('localstorage: got answer', this.key);
      const conn = this.conn;
      const key = this.key;
      conn.onOpen = () => {
        console.log('localstorage: connection to host open', key);
        conn.onOpen = null;
        this.fire('connection', conn);
      };
      conn.takeAnswer(decodeRSD(handshake.answer));
      this.conn = null;
      this.key = null;
      // TODO delete offer from localstorage
    }
  }
}
PeerLocalstorage.register();
