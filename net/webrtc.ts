///<reference path="../typings/index.d.ts" />

import {Connection} from "./connection";
import {Message} from "./message";

export function encodeRSD(rsd: RTCSessionDescription): string {
  return btoa(JSON.stringify(rsd)).replace(/=+/g, '');
}

export function decodeRSD(rsd: string): RTCSessionDescription {
  return new RTCSessionDescription(JSON.parse(atob(rsd)));
}

function pack(msg: Message): string {
  return JSON.stringify(msg);
}

function unpack(msg: string): Message {
  return JSON.parse(msg);
}

export class WebRTCConnection implements Connection {
  onMessage: (msg: Message, reliable?: boolean) => void;
  onOpen: () => void;
  onClose: () => void;

  private peer: RTCPeerConnection;
  private reliable: RTCDataChannel;
  private unreliable: RTCDataChannel;
  private open = false;

  constructor(config: RTCConfiguration) {
    const rtcPeerConnection: any = window.RTCPeerConnection ||
      window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    this.peer = new rtcPeerConnection(config);
  }

  send(msg: Message, reliable: boolean) {
    if (!this.open) {
      console.error('connection closed');
      return;
    }
    const packed = pack(msg);
    if (reliable) {
      this.reliable.send(packed);
    } else {
      this.unreliable.send(packed);
    }
  }

  close() {
    if (this.reliable) {
      this.reliable.close();
      this.reliable = null;
    }
    if (this.unreliable) {
      this.unreliable.close();
      this.unreliable = null;
    }
    this.peer.close();
    this.pokeState();
  }

  makeOffer(): Promise<RTCSessionDescription> {
    this.reliable = this.peer.createDataChannel('reliable');
    this.unreliable = this.peer.createDataChannel(
        'unreliable', {ordered: false, maxRetransmits: 0});
    this.setupChan(this.reliable, true);
    this.setupChan(this.unreliable, false);

    return new Promise((resolve, reject) => {
      this.peer.onicecandidate = (ev: RTCIceCandidateEvent) => {
        if (!ev.candidate) {
          resolve(this.peer.localDescription);
        }
      };
      this.peer.createOffer(offer => {
        this.peer.setLocalDescription(offer, () => {}, reject);
      }, reject);
    });
  }

  takeOffer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    this.peer.ondatachannel = (ev: RTCDataChannelEvent) => {
      const chan = ev.channel;
      if (chan.label == 'reliable') {
        this.reliable = chan;
        this.setupChan(chan, true);
      } else if (chan.label == 'unreliable') {
        this.unreliable = chan;
        this.setupChan(chan, false);
      } else {
        console.error('unexpected channel:', chan.label);
        return;
      }
    };

    return new Promise((resolve, reject) => {
      this.peer.onicecandidate = (ev: RTCIceCandidateEvent) => {
        if (!ev.candidate) {
          resolve(this.peer.localDescription);
        }
      };
      this.peer.setRemoteDescription(offer, () => {
        this.peer.createAnswer(answer => {
          this.peer.setLocalDescription(answer, () => {}, reject);
        }, reject);
      }, reject);
    });
  }

  takeAnswer(answer: RTCSessionDescription): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.peer.setRemoteDescription(answer, resolve, reject);
    });
  }

  private setupChan(chan: RTCDataChannel, reliable: boolean) {
    chan.onopen = chan.onclose = this.pokeState.bind(this);
    chan.onmessage = (ev: MessageEvent) => {
      if (this.onMessage) {
        this.onMessage(unpack(ev.data), reliable);
      }
    }
  }

  private pokeState() {
    const nowOpen = this.reliable && this.unreliable &&
        this.reliable.readyState == 'open' &&
        this.unreliable.readyState == 'open';
    if (nowOpen != this.open) {
      this.open = nowOpen;
      if (nowOpen) {
        if (this.onOpen) {
          this.onOpen();
        }
      } else if (this.onClose) {
        this.onClose();
      }
    }
  }
}
