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

    private ship: Core.Ship;
    private ships: Core.Ship[];
    private shipIdx: number = 0;

    private prevTs: number = 0;
    private lag: number = 0;

    private isServer: boolean;
    private offer: string;
    private answer: string;
    private client: WebRTCClient;
    private server: WebRTCServer;

    private urlQuery: string;

    ready(): void {
      this.ships = [
        new Core.Ship('P28', 30, 30, 0),
        new Core.Ship('A19', 18, 2, 18),
        new Core.Ship('S93', 20, 8, 37),
      ];
      this.ship = this.ships[0];
      this.frame(0);
    }

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
      // TODO is this the best way to do this?
      Polymer.dom.flush();  // elements might not be attached yet
      if (isServer) {
        this.server = this.$$('#server');
        this.client = null;
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

    @listen('net')
    onNet(event) {
      const msg = <Net.Msg>event.detail;
      if (msg.type == Net.Type.Chat) {
        this.$.lobby.receiveMsg(msg.chat);
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
      this.sendGood({type: Net.Type.Chat, chat: {text: event.detail.text}});
    }

    nextShip(): void {
      if (this.shipIdx == this.ships.length - 1) {
        this.shipIdx = 0;
      } else {
        this.shipIdx++;
      }
      this.ship = this.ships[this.shipIdx];
    }

    prevShip(): void {
      if (this.shipIdx == 0) {
        this.shipIdx = this.ships.length - 1;
      } else {
        this.shipIdx--;
      }
      this.ship = this.ships[this.shipIdx]
    }

    frame(ts: number): void {
      requestAnimationFrame(this.frame.bind(this));
      this.$.input.process();
      this.lag += ts - this.prevTs;
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
      this.prevTs = ts;
    }
  }
  Game.register();
}
