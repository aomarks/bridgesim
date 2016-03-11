///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="network.ts" />

namespace Bridgesim.Client {

  const PEER_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  @component('bridgesim-webrtc-client')
  export class WebRTCClient extends polymer.Base {
    private peer: RTCPeerConnection;
    goodChan: RTCDataChannel;
    fastChan: RTCDataChannel;

    attached(): void {
      this.peer = new webkitRTCPeerConnection(PEER_CONFIG);
      this.goodChan = this.peer.createDataChannel('good');
      this.fastChan = this.peer.createDataChannel(
          'fast', {ordered: false, maxRetransmits: 0});
      [this.goodChan, this.fastChan].forEach(chan => {
        chan.onopen = () => {
          if (this.connected()) {
            this.fire('connected');
          }
        };
        chan.onmessage = msg => { this.fire('net', Net.unpack(msg.data)); }
      });
    }

    connected(): boolean {
      return this.goodChan.readyState == 'open' &&
             this.fastChan.readyState == 'open';
    }

    detached(): void {
      this.fastChan.close();
      this.goodChan.close();
      this.peer.close();
    }

    makeOffer(): Promise<RTCSessionDescription> {
      return new Promise((resolve, reject) => {
        this.peer.onicecandidate = (event: RTCIceCandidateEvent) => {
          if (!event.candidate) {
            resolve(this.peer.localDescription);
          }
        };
        this.peer.createOffer(offer => {
          this.peer.setLocalDescription(offer, () => {}, reject);
        }, reject);
      });
    }

    acceptAnswer(answer: RTCSessionDescription): Promise<{}> {
      return new Promise((resolve, reject) => {
        this.peer.setRemoteDescription(answer, resolve, reject);
      });
    }
  }
  WebRTCClient.register();
}
