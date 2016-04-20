///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="../core/host.ts" />
///<reference path="../net/message.ts" />
///<reference path="../net/webrtc.ts" />
///<reference path="../net/loopback.ts" />
///<reference path="../net/conditioner.ts" />
///<reference path="const.ts" />
///<reference path="settings.ts" />
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

    @property({type: Object}) settings: Settings;

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

    private host: Core.Host;

    // client -> server
    private conn: Net.Connection;
    private conditioner: Net.Conditioner;

    private clientId: number;
    private ship: Core.Ship;
    private ships: Core.Ship[];
    private shipId: number;
    private players: Net.Player[];

    private latestSnapshot: Net.Snapshot;
    private latestSnapshotMs: number = 0;
    private latestSeq = -1;
    private seq: number = 0;
    private commandBuffer: Net.Commands[] = [];

    private prevTs: number = 0;
    private lag: number = 0;

    private urlQuery: string;

    private animationRequestId: number;

    ready(): void {
      this.settings = {
        localPredict: true,
        localInterpolate: true,
        remoteInterpolate: true,
        fakeLatency: 0,
        fakePacketLoss: 0,
        tickInterval: 1000 / 30,
        snapshotInterval: 1000 / 15,
        commandBufferSize: 100,
      };

      this.ships = [];

      if (this.urlQuery.indexOf('host') != -1) {
        this.isHost = true;
      } else if (this.urlQuery.indexOf('client') != -1) {
        this.makeLocalOffer();
      }

      this.listen(window, 'keydown', 'focusLobby');
    }

    openSettingsDialog(): void { this.$.settingsDialog.open(); }

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
        this.host = new Core.Host();
        this.host.addConnection(loopback.b);
        this.host.start();
        loopback.open();
      }
    }

    @observe('settings.fakeLatency')
    fakeLatencyChanged(val: number) {
      if (this.conditioner) {
        this.conditioner.latency = val;
      }
    }

    @observe('settings.fakePacketLoss')
    fakePacketLossChanged(val: number) {
      if (this.conditioner) {
        this.conditioner.packetLoss = val / 100;
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
      this.latestSnapshot = null;
      this.latestSeq = -1;
      this.prevTs = 0;
      this.lag = 0;
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
      this.conditioner = new Net.Conditioner(this.conn);
      this.conditioner.latency = this.settings.fakeLatency;
      this.conditioner.packetLoss = this.settings.fakePacketLoss;
      this.conn = this.conditioner;

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
        this.settings.snapshotInterval = msg.welcome.snapshotInterval;
        this.clientId = msg.welcome.clientId;
        this.shipId = msg.welcome.shipId;
        this.applySnapshot(msg.welcome.snapshot);
        this.ship = this.ships[this.shipId];
        this.frame(0);
        this.$.joinDialog.close();

      } else if (msg.playerList) {
        this.players = msg.playerList.players;
        console.log('new player list', this.players);

      } else if (msg.receiveChat) {
        this.$.chat.receiveMsg(msg.receiveChat);

      } else if (msg.snapshot) {
        if (msg.snapshot.seq > this.latestSeq) {
          this.latestSnapshotMs = performance.now();
          this.latestSnapshot = msg.snapshot;
          this.latestSeq = msg.snapshot.seq;
        }
      }
    }

    sendChat(event: {detail: ChatEvent}): void {
      this.conn.send({sendChat: {text: event.detail.text}}, true);
    }

    applySnapshot(snapshot: Net.Snapshot): void {
      snapshot.ships.forEach(u => {
        let ship = this.ships[u.shipId];
        if (!ship) {
          ship = new Core.Ship(u.shipId.toString(), u.x, u.y, u.heading);
          ship.thrust = u.thrust;
          this.ships[u.shipId] = ship;
        } else {
          ship.setPos(u.x, u.y);
          ship.heading = u.heading;
          ship.thrust = u.thrust;
        }
      });
    }

    frame(ts: number): void {
      this.animationRequestId = requestAnimationFrame(this.frame.bind(this));

      if (this.latestSnapshot) {
        this.applySnapshot(this.latestSnapshot);
        if (this.settings.localPredict) {
          const offset = this.seq - this.latestSnapshot.seq;
          const length = this.commandBuffer.length;
          for (let i = length - offset + 1; i < length; i++) {
            this.ship.applyCommands(this.commandBuffer[i]);
            this.ship.tick();
          }
        }
        this.latestSnapshot = null;
      }

      const elapsed = ts - this.prevTs;
      this.lag += elapsed;

      let commands: Net.Commands;
      while (this.lag >= this.settings.tickInterval) {
        commands = this.$.input.process();
        commands.seq = this.seq;
        if (this.commandBuffer.length === this.settings.commandBufferSize) {
          this.commandBuffer.shift();
        }
        this.commandBuffer.push(commands);

        if (this.settings.localPredict) {
          this.ship.applyCommands(commands);
          this.ship.tick();
        }
        this.lag -= this.settings.tickInterval;
        this.seq++;
      }
      if (commands) {
        this.conn.send({commands: commands}, false);
      }

      const station = this.$.stations.selectedItem;
      if (station) {
        let localAlpha = this.lag / this.settings.tickInterval;
        let remoteAlpha = Math.min(
            1, (ts - this.latestSnapshotMs) / this.settings.snapshotInterval);

        if (!this.settings.localInterpolate) {
          localAlpha = 1;
        } else if (!this.settings.localPredict) {
          localAlpha = remoteAlpha;
        }
        if (!this.settings.remoteInterpolate) {
          remoteAlpha = 1;
        }

        station.draw(localAlpha, remoteAlpha);
      }

      this.prevTs = ts;
    }
  }
  Game.register();
}
