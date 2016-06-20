///<reference path="../typings/index.d.ts" />

import {Connection} from './connection';
import {Message} from './message';

export function encodeRSD(rsd: RTCSessionDescription): string {
  return btoa(JSON.stringify(rsd)).replace(/=+/g, '');
}

export function decodeRSD(rsd: string): RTCSessionDescription {
  return new RTCSessionDescription(JSON.parse(atob(rsd)));
}

function pack(msg: MetaMessage): string {
  return JSON.stringify(msg);
}

function unpack(msg: string): MetaMessage {
  return JSON.parse(msg);
}

interface MetaMessage {
  pieces?: number;
  msg?: Message;
}

export class WebRTCConnection implements Connection {
  onMessage: (msg: Message, reliable: boolean, bytes: number) => void;
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
    const packed = pack({msg: msg});
    if (reliable) {
      const packetSize = 1 << 14;  // 16KB
      if (packed.length > packetSize) {
        this.reliable.send(
            pack({pieces: Math.ceil(packed.length / packetSize)}));
      }
      for (let i = 0; i < packed.length; i += packetSize) {
        this.reliable.send(packed.substr(i, packetSize));
      }
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
    let buf = '';
    let remaining = 0;
    chan.onmessage = (ev: MessageEvent) => {
      if (this.onMessage) {
        if (remaining > 0) {
          buf += ev.data;
          remaining -= 1;
          if (remaining > 0) {
            return;
          }
          return;
        }
        const data = buf.length ? buf : ev.data;
        const meta = unpack(data);
        if (meta.pieces > 0) {
          buf = '';
          remaining = meta.pieces;
          return;
        }
        // WebRTC transmits strings as UTF-8.
        this.onMessage(meta.msg, reliable, data.length);
        if (buf.length) {
          buf = '';
        }
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
