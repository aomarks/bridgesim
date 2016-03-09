///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />

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
        chan.onopen =
            () => { console.log('client channel open:', chan.label); };
        chan.onmessage =
            msg => { console.log('client received message:', chan.label, msg); }
      });
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

    receiveAnswer(answer: RTCSessionDescription): Promise<{}> {
      return new Promise((resolve, reject) => {
        this.peer.setRemoteDescription(answer, resolve, reject);
      });
    }
  }
  WebRTCClient.register();
}
