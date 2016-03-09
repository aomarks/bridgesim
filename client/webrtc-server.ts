///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />

namespace Bridgesim.Client {

  const PEER_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  @component('bridgesim-webrtc-server')
  export class WebRTCServer extends polymer.Base {
    clients: Client[] = [];

    detached(): void {
      this.clients.forEach(client => { client.close(); });
    }

    acceptOffer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
      const client = new Client(this.clients.length);
      this.clients.push(client);
      return client.makeAnswer(offer);
    }
  }
  WebRTCServer.register();

  class Client {
    private peer: RTCPeerConnection;
    goodChan: RTCDataChannel;
    fastChan: RTCDataChannel;

    constructor(public id: number) {
      this.peer = new webkitRTCPeerConnection(PEER_CONFIG);
      this.peer.ondatachannel = (event: RTCDataChannelEvent) => {
        const chan = event.channel;
        chan.onopen =
            () => { console.log('server channel open:', this.id, chan.label); };
        chan.onmessage = msg => {
          console.log('server received message:', this.id, chan.label, msg);
        };
        if (chan.label == 'good') {
          this.goodChan = chan;
        } else if (chan.label == 'fast') {
          this.fastChan = chan;
        } else {
          console.error('unexpected data channel:', this.id, chan.label);
        }
      };
    }

    close(): void {
      if (this.fastChan) {
        this.fastChan.close();
      }
      if (this.goodChan) {
        this.goodChan.close();
      }
      this.peer.close();
    }

    makeAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
      return new Promise((resolve, reject) => {
        this.peer.onicecandidate = event => {
          if (event.candidate == null) {
            resolve(this.peer.localDescription);
          }
        };
        this.peer.setRemoteDescription(offer, () => {
          this.peer.createAnswer(answer => {
            this.peer.setLocalDescription(answer, () => {}, reject);
          }, reject);
        });
      });
    }
  }
}
