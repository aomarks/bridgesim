///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="network.ts" />

namespace Bridgesim.Client {

  const PEER_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  const MS_PER_TICK = 1000 / 30;

  @component('bridgesim-webrtc-server')
  export class WebRTCServer extends polymer.Base {
    clients: Client[] = [];
    ships: Core.Ship[] = [];
    clientToShip: {[clientId: number]: Core.Ship} = {};

    attached(): void {
      this.fire('connected');  // local client is always connected
      this.tick();
    }

    detached(): void {
      this.clients.forEach(client => { client.close(); });
    }

    tick(): void {
      setTimeout(this.tick.bind(this), MS_PER_TICK);
      const sync: Net.Sync = {updates: this.updates()};
      this.broadcastFast({type: Net.Type.Sync, sync: sync});
    }

    updates(): Net.Update[] {
      const updates = [];
      this.ships.forEach((ship, shipId) => {
        updates.push(
            {shipId: shipId, x: ship.x, y: ship.y, heading: ship.heading});
      });
      return updates;
    }

    acceptOffer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
      const client = new Client(this.clients.length, this.receive.bind(this));
      this.clients.push(client);
      return client.makeAnswer(offer);
    }

    receive(clientId: number, msg: Net.Msg): void {
      if (msg.type == Net.Type.Hello) {
        const shipId = this.ships.length;
        const ship = new Core.Ship(shipId.toString(), 0, 0, 0);
        this.ships.push(ship);
        this.clientToShip[clientId] = ship;
        const welcome: Net.Welcome = {
          clientId: clientId,
          shipId: shipId,
          updates: this.updates()
        };
        const msg = {type: Net.Type.Welcome, welcome: welcome};
        if (clientId == -1) {
          this.fire('net', msg);
        } else {
          this.clients[clientId].goodChan.send(Net.pack(msg));
        }

      } else if (msg.type == Net.Type.SendChat) {
        const rc: Net.ReceiveChat = {
          timestamp: Date.now(),
          clientId: clientId,
          text: msg.sendChat.text,
        };
        this.broadcastGood({type: Net.Type.ReceiveChat, receiveChat: rc});

      } else if (msg.type == Net.Type.Update) {
        const ship = this.clientToShip[clientId];
        ship.x = msg.update.x;
        ship.y = msg.update.y;
        ship.heading = msg.update.heading;
      }
    }

    broadcastGood(msg: Net.Msg): void {
      this.fire('net', msg);  // for the local client
      const packed = Net.pack(msg);
      this.clients.forEach(client => {
        if (client.connected()) {
          client.goodChan.send(packed);
        }
      });
    }

    broadcastFast(msg: Net.Msg): void {
      this.fire('net', msg);
      const packed = Net.pack(msg);
      this.clients.forEach(client => {
        if (client.connected()) {
          client.fastChan.send(packed);
        }
      });
    }
  }
  WebRTCServer.register();

  class Client {
    private peer: RTCPeerConnection;
    goodChan: RTCDataChannel;
    fastChan: RTCDataChannel;

    constructor(public id: number,
                onMsg: (clientId: number, msg: Net.Msg) => void) {
      this.peer = new webkitRTCPeerConnection(PEER_CONFIG);
      this.peer.ondatachannel = (event: RTCDataChannelEvent) => {
        const chan = event.channel;
        chan.onopen =
            () => { console.log('server channel open:', this.id, chan.label); };
        chan.onmessage =
            (msg: MessageEvent): void => { onMsg(id, Net.unpack(msg.data)) };
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

    connected(): boolean {
      return this.goodChan && this.fastChan &&
             this.goodChan.readyState == 'open' &&
             this.fastChan.readyState == 'open';
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
