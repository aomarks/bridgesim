///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="../net/message.ts" />
///<reference path="../net/host.ts" />
///<reference path="../net/webrtc.ts" />
///<reference path="../net/loopback.ts" />
///<reference path="const.ts" />
///<reference path="map.ts" />
///<reference path="nav.ts" />
///<reference path="thrust.ts" />
///<reference path="power.ts" />
///<reference path="chat.ts" />

namespace Bridgesim.Client {

  const RTC_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  interface localOffer {
    offer: RTCSessionDescriptionInit;
    answer: RTCSessionDescriptionInit;
    pending: boolean;
  }

  @component('bridgesim-game')
  class Game extends polymer.Base {
    @property({type: Number, value: 100}) size: number;

    private isHost: boolean;

    @property({value: 'helm', type: String}) station: string;

    @computed()
    isClient(isHost: boolean): boolean {
      return !isHost;
    }

    // WebRTC token signalling
    private pendingConn: Net.WebRTCConnection;
    private copyOffer: string;
    private copyAnswer: string;
    private pasteOffer: string;
    private pasteAnswer: string;
    private localOffers: {[key: string]: localOffer};
    private localOfferKey: string;

    private host: Net.Host;

    // client -> server
    private conn: Net.Connection;

    private clientId: number;
    private ship: Core.Ship;
    private ships: Core.Ship[];
    private shipId: number;

    private latestSync: Net.Sync;
    private latestSeq = -1;

    private prevTs: number = 0;
    private lag: number = 0;
    private netLag: number = 0;

    private urlQuery: string;

    private animationRequestId: number;

    ready(): void {
      this.ships = [];
      if (this.urlQuery.indexOf('host') != -1) {
        this.isHost = true;
      } else if (this.urlQuery.indexOf('client') != -1) {
        this.makeLocalOffer();
      }

      this.listen(window, 'keydown', 'focusLobby');
    }

    focusLobby(ev: KeyboardEvent) {
      if (ev.keyCode === 13) {  // enter
        (<Chat>this.$$('bridgesim-chat')).focus();
      }
    }

    @observe('isHost')
    isHostChanged(isHost: boolean): void {
      this.resetSimulation();
      this.resetNetwork();
      if (isHost) {
        const loopback = new Net.Loopback();
        this.conn = loopback.a;
        this.setupConn();
        this.host = new Net.Host();
        this.host.addConnection(loopback.b);
        this.host.start();
        loopback.open();
      }
    }

    resetSimulation() {
      console.log('reset simulation');
      if (this.animationRequestId != null) {
        cancelAnimationFrame(this.animationRequestId);
        this.animationRequestId = null;
      }
      this.ship = null;
      this.ships = [];
      this.shipId = null;
      this.latestSync = null;
      this.latestSeq = -1;
      this.prevTs = 0;
      this.lag = 0;
      this.netLag = 0;
    }

    resetNetwork() {
      console.log('reset network');
      if (this.conn) {
        this.conn.close();
        this.conn = null;
      }
      if (this.host) {
        this.host.stop();
        this.host = null;
      }
      this.clientId = null;
    }

    setupConn() {
      this.conn.onOpen =
          () => { this.conn.send({hello: {name: 'stranger'}}, true); };
      this.conn.onMessage = this.onMessage.bind(this);
      this.conn.onClose = () => {
        console.log('disconnected');
        this.resetSimulation();
      }
    }

    initLocalOffers() { this.localOffers = {}; }

    @observe('localOffers')
    onLocalOffers(offers: {[key: string]: localOffer}) {
      console.log('localOffers:', offers);
      if (!offers) {
        return;
      }
      if (this.host) {
        Object.keys(offers).forEach(key => {
          const o = offers[key];
          if (!o.pending) {
            console.log('accepting local offer', key, o);
            o.pending = true;
            const conn = new Net.WebRTCConnection(RTC_CONFIG);
            conn.onOpen = () => { this.host.addConnection(conn); };
            conn.takeOffer(new RTCSessionDescription(o.offer))
                .then(answer => {
                  this.set('localOffers.' + key + '.answer', answer);
                });
          }
        });

      } else if (this.localOfferKey != null) {
        const key = this.localOfferKey;
        const o = offers[key];
        if (o && o.answer) {
          console.log('accepting local answer', key, o.answer);
          this.pendingConn.takeAnswer(new RTCSessionDescription(o.answer));
          // TODO delete offer from localstorage
        }
      }
    }

    makeLocalOffer() {
      this.localOfferKey = Math.floor(Math.random() * 10000).toString();
      this.conn = this.pendingConn = new Net.WebRTCConnection(RTC_CONFIG);
      this.setupConn();
      this.pendingConn.makeOffer().then(offer => {
        console.log('making local offer', this.localOfferKey, offer);
        this.set('localOffers.' + this.localOfferKey, {offer: offer});
      });
    }

    joinGame(): void {
      this.$.joinDialog.open();
      this.conn = this.pendingConn = new Net.WebRTCConnection(RTC_CONFIG);
      this.setupConn();
      this.pendingConn.makeOffer().then(
          offer => { this.copyOffer = Net.encodeRSD(offer); });
    }

    invitePlayer(): void { this.$.inviteDialog.open(); }

    @observe('pasteOffer')
    onPasteOffer(offer: string): void {
      if (!offer) {
        return;
      }
      this.pendingConn = new Net.WebRTCConnection(RTC_CONFIG);
      this.pendingConn.onOpen = () => {
        this.host.addConnection(this.pendingConn);
        this.$.inviteDialog.close();
      };
      this.pendingConn.takeOffer(Net.decodeRSD(offer))
          .then(answer => { this.copyAnswer = Net.encodeRSD(answer); });
    }

    @observe('pasteAnswer')
    onPasteAnswer(answer: string): void {
      if (!answer) {
        return;
      }
      this.pendingConn.takeAnswer(Net.decodeRSD(answer));
    }

    clearTokens(): void {
      this.pendingConn = null;
      this.copyOffer = '';
      this.copyAnswer = '';
      this.pasteOffer = '';
      this.pasteAnswer = '';
    }

    selectAndCopy(event: Event): void {
      (<HTMLTextAreaElement>event.target).select();
      document.execCommand('copy');
    }

    onMessage(msg: Net.Message) {
      if (msg.welcome) {
        console.log('welcome', msg.welcome);
        this.clientId = msg.welcome.clientId;
        this.shipId = msg.welcome.shipId;
        this.applyUpdates(msg.welcome.updates);
        this.ship = this.ships[this.shipId];
        this.frame(0);
        this.$.joinDialog.close();

      } else if (msg.receiveChat) {
        this.$.chat.receiveMsg(msg.receiveChat);

      } else if (msg.sync) {
        const offset = msg.seq - this.latestSeq;
        if (offset != 1) {
          console.log('missed', offset - 1, 'server updates');
        }
        if (offset > 0) {
          this.latestSync = msg.sync;
          this.latestSeq = msg.seq;
        }
      }
    }

    sendChat(event: {detail: ChatEvent}): void {
      this.conn.send({sendChat: {text: event.detail.text}}, true);
    }

    applyUpdates(updates: Net.Update[]): void {
      updates.forEach(u => {
        let ship = this.ships[u.shipId];
        if (!ship) {
          ship = new Core.Ship(u.shipId.toString(), u.x, u.y, u.heading);
          ship.thrust = u.thrust;
          this.ships[u.shipId] = ship;
        } else if (u.shipId != this.shipId) {
          ship.x = u.x;
          ship.y = u.y;
          ship.heading = u.heading;
          ship.thrust = u.thrust;
        }
      });
    }

    frame(ts: number): void {
      this.animationRequestId = requestAnimationFrame(this.frame.bind(this));

      if (this.latestSync) {
        this.applyUpdates(this.latestSync.updates);
        this.latestSync = null;
      }

      this.$.input.process();

      const elapsed = ts - this.prevTs;
      this.lag += elapsed;
      this.netLag += elapsed;

      while (this.lag >= SIM_TICK) {
        for (var i = 0; i < this.ships.length; i++) {
          this.ships[i].tick();
        }
        this.lag -= SIM_TICK;
      }

      const station = this.$.stations.selectedItem;
      if (station) {
        station.draw();
      }

      if (this.netLag >= NET_TICK) {
        const update: Net.Update = {
          x: this.ship.x,
          y: this.ship.y,
          heading: this.ship.heading,
          thrust: this.ship.thrust
        };
        this.conn.send({update: update}, false);
        this.netLag = 0;
      }

      this.prevTs = ts;
    }
  }
  Game.register();
}
