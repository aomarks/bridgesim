///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="const.ts" />
///<reference path="map.ts" />
///<reference path="nav.ts" />
///<reference path="thrust.ts" />
///<reference path="power.ts" />
///<reference path="webrtc-server.ts" />
///<reference path="webrtc-client.ts" />
///<reference path="network.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-game')
  class Game extends polymer.Base {
    @property({type: Number, value: 50}) size: number;

    private clientId: number;
    private ship: Core.Ship;
    private ships: Core.Ship[];
    private shipId: number = 0;

    private latestSync: Net.Sync;
    private prevTs: number = 0;
    private lag: number = 0;
    private netLag: number = 0;

    private isServer: boolean;
    private offer: string;
    private answer: string;
    private client: WebRTCClient;
    private server: WebRTCServer;

    private urlQuery: string;


    ready(): void { this.ships = []; }

    @computed()
    isClient(isServer): boolean {
      return !isServer;
    }

    @observe('urlQuery')
    urlQueryChanged(urlQuery): void {
      if (this.urlQuery.indexOf('server') != -1) {
        this.isServer = true;
        this.invitePlayer();
      } else if (this.urlQuery.indexOf('join') != -1) {
        // TODO This is dumb.
        setTimeout(this.joinGame.bind(this), 100);
      }
    }

    @observe('isServer')
    isServerChanged(isServer): void {
      // TODO doesn't work on toggle
      Polymer.dom.flush();  // elements might not be attached yet
      if (isServer) {
        this.server = this.$$('#server');
      } else {
        this.client = this.$$('#client');
        this.server = null;
      }
    }

    /** Send a network message over the reliable channel. */
    sendGood(msg: Net.Msg): void {
      if (this.isServer) {
        // we use -1 for the fake local client peer id
        this.server.receive(-1, msg);
      } else if (this.client.connected()) {
        this.client.goodChan.send(Net.pack(msg));
      }
    }

    /** Send a network message over the unreliable channel. */
    sendFast(msg: Net.Msg): void {
      if (this.isServer) {
        this.server.receive(-1, msg);
      } else if (this.client.connected()) {
        this.client.fastChan.send(Net.pack(msg));
      }
    }

    @listen('connected')
    onConnected() {
      console.log('connected');
      this.sendGood({type: Net.Type.Hello, hello: {name: 'stranger'}});
    }

    @listen('net')
    onNet(event) {
      const msg = <Net.Msg>event.detail;
      if (msg.type == Net.Type.Welcome) {
        this.clientId = msg.welcome.clientId;
        this.shipId = msg.welcome.shipId;
        this.applyUpdates(msg.welcome.updates);
        this.ship = this.ships[this.shipId];
        this.frame(0);
        this.$.joinDialog.close();

      } else if (msg.type == Net.Type.ReceiveChat) {
        this.$.lobby.receiveMsg(msg.receiveChat);

      } else if (msg.type == Net.Type.Sync) {
        this.latestSync = msg.sync;
      }
    }

    joinGame(): void {
      this.client.makeOffer().then(offer => {
        this.offer = this.encodeRSD(offer);
        this.$.joinDialog.open();
      });
    }

    invitePlayer(): void { this.$.inviteDialog.open(); }

    clearTokens(): void {
      this.offer = '';
      this.answer = '';
    }

    selectAndCopy(event: Event): void {
      (<HTMLTextAreaElement>event.target).select();
      document.execCommand('copy');
    }

    @observe('offer')
    offerChanged(offer): void {
      if (offer && this.isServer) {
        this.server.acceptOffer(this.decodeRSD(offer))
            .then(answer => { this.answer = this.encodeRSD(answer); });
      }
    }

    @observe('answer')
    answerChanged(answer): void {
      if (answer && !this.isServer) {
        this.client.acceptAnswer(this.decodeRSD(answer));
      }
    }

    encodeRSD(decoded: RTCSessionDescription): string {
      return btoa(JSON.stringify(decoded));
    }

    decodeRSD(encoded: string): RTCSessionDescription {
      return new RTCSessionDescription(JSON.parse(atob(encoded)));
    }

    sendChat(event): void {
      this.sendGood(
          {type: Net.Type.SendChat, sendChat: {text: event.detail.text}});
    }

    applyUpdates(updates: Net.Update[]): void {
      updates.forEach(u => {
        let ship = this.ships[u.shipId];
        if (!ship) {
          ship = new Core.Ship(u.shipId.toString(), u.x, u.y, u.heading);
          this.ships[u.shipId] = ship;
        } else if (u.shipId != this.shipId) {
          ship.x = u.x;
          ship.y = u.y;
          ship.heading = u.heading;
        }
      });
    }

    frame(ts: number): void {
      requestAnimationFrame(this.frame.bind(this));

      if (this.latestSync) {
        this.applyUpdates(this.latestSync.updates);
        this.latestSync = null;
      }

      this.$.input.process();

      const elapsed = ts - this.prevTs;
      this.lag += elapsed;
      this.netLag += elapsed;

      while (this.lag >= MPF) {
        for (var i = 0; i < this.ships.length; i++) {
          this.ships[i].tick();
        }
        this.lag -= MPF;
      }

      this.$.map.draw();
      this.$.nav.draw();
      this.$.thrust.draw();
      this.$.power.draw();

      if (this.netLag >= 1000 / 30) {
        const update: Net.Update = {
          x: this.ship.x,
          y: this.ship.y,
          heading: this.ship.heading
        };
        this.sendFast({type: Net.Type.Update, update: update});
        this.netLag = 0;
      }

      this.prevTs = ts;
    }
  }
  Game.register();
}
