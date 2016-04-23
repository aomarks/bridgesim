///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../net/webrtc.ts" />

namespace Bridgesim.Client {

  const RTC_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  interface handshake {
    offer: RTCSessionDescriptionInit;
    answer: RTCSessionDescriptionInit;
    accepted: boolean;
  }

  @component('bridgesim-peer-localstorage')
  class PeerLocalstorage extends polymer.Base {
    @property({type: Boolean}) isHost: boolean;
    @property({type: Object}) handshakes: {[key: string]: handshake};
    private key: string;
    private conn: Net.WebRTCConnection;

    makeOffer(): void {
      if (this.isHost) {
        return;
      }
      this.key = Math.floor(Math.random() * 10000).toString();
      this.conn = new Net.WebRTCConnection(RTC_CONFIG);
      this.conn.makeOffer().then(
          offer => { this.set('handshakes.' + this.key, {offer: offer}); });
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
        handshake.accepted = true;
        const conn = new Net.WebRTCConnection(RTC_CONFIG);
        conn.onOpen = () => {
          conn.onOpen = null;
          this.fire('connection', conn);
        };
        conn.takeOffer(new RTCSessionDescription(handshake.offer))
            .then(answer => {
              this.set('handshakes.' + key + '.answer', answer);
            });
      }
    }

    checkIfAccepted(): void {
      const handshake = this.handshakes[this.key];
      if (handshake && handshake.answer) {
        this.conn.takeAnswer(new RTCSessionDescription(handshake.answer));
        this.fire('connection', this.conn);
        this.key = null;
        this.conn = null;
        // TODO delete offer from localstorage
      }
    }
  }
  PeerLocalstorage.register();
}
