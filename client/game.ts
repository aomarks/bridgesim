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

namespace Bridgesim.Client {

  @component('bridgesim-game')
  class Game extends polymer.Base {
    @property({type: Number, value: 50}) size: number;

    private ship: Core.Ship;
    private ships: Core.Ship[];
    private shipIdx: number = 0;

    private prevTs: number = 0;
    private lag: number = 0;

    private map: Map;
    private nav: Nav;
    private thrust: Thrust;
    private power: Power;

    private isServer: boolean;
    private offer: string;
    private answer: string;
    private msg: string;
    private players: string[];
    private chatBuffer: string[];

    private urlQuery: string;

    ready(): void {
      this.map = this.$.map;
      this.nav = this.$.nav;
      this.thrust = this.$.thrust;
      this.power = this.$.power;

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
        setTimeout(this.joinGame.bind(this), 1000);
      }
    }

    @listen('network-chat')
    onChat(event) {
      this.$.lobby.receiveMsg(event.detail);
    }

    joinGame(): void {
      const client: WebRTCClient = this.$$('#client');
      client.makeOffer().then(offer => {
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
        const server: WebRTCServer = this.$$('#server');
        server.acceptOffer(this.decodeRSD(offer))
            .then(answer => { this.answer = this.encodeRSD(answer); });
      }
    }

    @observe('answer')
    answerChanged(answer): void {
      if (answer && !this.isServer) {
        const client: WebRTCClient = this.$$('#client');
        client.acceptAnswer(this.decodeRSD(answer));
      }
    }

    encodeRSD(decoded: RTCSessionDescription): string {
      return btoa(JSON.stringify(decoded));
    }

    decodeRSD(encoded: string): RTCSessionDescription {
      return new RTCSessionDescription(JSON.parse(atob(encoded)));
    }

    sendChat(event): void {
      if (!this.isServer) {
        const client: WebRTCClient = this.$$('#client');
        client.goodChan.send(
            JSON.stringify({type: 'chat', detail: event.detail}));
      }
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
      this.map.draw();
      this.nav.draw();
      this.thrust.draw();
      this.power.draw();
      this.prevTs = ts;
    }
  }
  Game.register();
}
