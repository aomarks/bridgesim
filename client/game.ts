///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {Client} from '../core/client';
import {Update} from '../core/comdb';
import {Db} from '../core/entity/db';
import {Conditioner} from '../net/conditioner';
import {Connection} from '../net/connection';
import * as Net from '../net/message';

import {ChatEvent} from './chat';
import {Settings} from './settings';

// Milliseconds to wait after we last heard from the host before we assume it's
// gone forever.
const HOST_TIMEOUT = 10 * 1000;

@component('bridgesim-game')
class Game extends polymer.Base {
  @property({type: Boolean, value: false}) hosting: boolean;
  @property({type: Boolean, value: false}) joining: boolean;
  @property({type: Boolean, value: false}) scanLocal: boolean;
  @property({type: Boolean, value: false}) connected: boolean;
  @property({type: Boolean, value: false}) gameOver: boolean;
  @property({type: String, value: null}) token: string;
  @property({type: String, value: null}) errorMsg: string;
  @property({type: String, value: null}) loadingMsg: string;
  @property({type: String, value: 'welcome'}) view: string;
  @property({type: String, value: 'helm'}) defaultStation: string;
  @property({type: Object, value: ()=> { return {}; }}) views: any;
  @property({type: Number, value: 1}) size: number;

  @property({
    type: Object,
    value: ()=> {
      return {
        interpolate: true,
        fakeLatency: 0,
        fakePacketLoss: 0,
        frameLimit: 0,
        name: null,
        showBoundingBoxes: false,
        showQuadtree: false,
        showPathfinding: false,
        showMetrics: true,
        showMotion: false,
      };
    },
  })
  settings: Settings;

  @property({type: Object}) db: Db;

  @property({type: String}) urlHash: string;
  @property({type: Object}) urlParams: any;

  @property({type: Boolean, value: true}) serverHidden: boolean;
  @property({type: String}) playerId: string;
  @property({type: String}) shipId: string;

  private client: Client;
  private conn: Connection;
  private conditioner: Conditioner;
  private prevTs: number = 0;
  private urlQuery: string;
  private animationRequestId: number;

  ready(): void { console.log('game: ready'); }

  detached() { this.disconnect(); }

  disconnect() {
    console.log('game: disconnect');
    this.cancelDebouncer('host-timeout');
    cancelAnimationFrame(this.animationRequestId);

    if (this.client) {
      this.client.stop();
    }

    if (this.conn) {
      this.conn.onClose = null;  // Prevent loops.
      this.conn.close();
    }

    this.db = null;
    this.client = null;
    this.conn = null;
    this.conditioner = null;
    this.playerId = null;
    this.shipId = null;
    this.connected = false;
    this.hosting = false;
    this.joining = false;
    this.prevTs = 0;
  }

  @observe('urlHash')
  urlHashChanged(hash: string) {
    if (!hash || hash === 'null') {
      // TODO Why is hash sometimes the string "null"?
      return;
    }

    if (hash === 'host') {
      this.hosting = true;

    } else if (hash === 'local') {
      this.scanLocal = true;
      this.view = 'loading';
      this.loadingMsg = 'searching for local game';

    } else {
      this.view = 'join';
      this.token = hash;
      this.$.joinScreen.join();
    }
  }

  @observe('urlParams')
  urlParamsChanged(params: any) {
    if (params.station) {
      this.defaultStation = params.station;
    }
    if (params.view) {
      this.view = params.view;
    }
    if (params.nolerp != null) {
      this.set('settings.interpolate', false);
    }
    if (params.nometrics != null) {
      this.set('settings.showMetrics', false);
    }
  }

  showWelcome() { this.view = 'welcome'; }

  @property({computed: 'computeShowJoin(connecting, connected)'})
  showJoin: boolean;
  computeShowJoin(): boolean { return true; }

  @property({computed: 'computeShowStations(connected, gameOver)'})
  showStations: boolean;
  computeShowStations(connected: boolean, gameOver: boolean): boolean {
    return connected && !gameOver;
  }

  @observe('hosting')
  hostingChanged(hosting: boolean) {
    if (hosting) {
      this.urlHash = 'host';

      // We should expect an incoming local connection.
      this.view = 'loading';
      this.loadingMsg = 'starting host';

      // The local storage system needs to know where to send offers. Set this
      // up async because the elements won't have been stamped out yet.
      // TODO Do this with data binding more cleanly.
      this.async(() => {
        const host = this.$$('#host');
        this.$$('#peerLocalstorage').takeOffer = host.onOffer.bind(host);
      });

    } else {
      this.urlHash = null;
    }
  }

  @observe('view')
  viewChanged(view: string) {
    this.views = {[view]: true};
  }

  openSettingsDialog(): void { this.$.settingsDialog.open(); }

  openLobbyDialog(): void { this.$.lobbyDialog.open(); }

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

  @observe('settings.name')
  nameChanged(name: string) {
    if (this.conn) {
      this.conn.send({updatePlayer: {name: name}}, true);
    }
  }

  @listen('loading')
  onLoading(ev: {detail: string}) {
    this.loadingMsg = ev.detail || 'loading';
    this.view = 'loading';
  }

  @listen('error')
  onError(ev: {detail: string}) {
    this.errorMsg = ev.detail || 'error';
    this.view = 'error';
  }

  @listen('connection')
  onConnection(event: {detail: Connection}): void {
    console.log('game: got connection');
    this.conditioner = new Conditioner(event.detail);
    this.conditioner.latency = this.settings.fakeLatency;
    this.conditioner.packetLoss = this.settings.fakePacketLoss;
    this.conn = this.conditioner;

    this.conn.onMessage = this.onMessage.bind(this);
    this.client =
        new Client(this.conn, this.$.input.process.bind(this.$.input));

    this.conn.onClose = () => {
      this.view = 'error';
      this.errorMsg = 'host disconnected';
      this.disconnect();
    };

    console.log('game: sending hello');
    this.conn.send({hello: {name: this.settings.name}}, true);
  }

  hostGame(): void { this.hosting = true; }

  joinGame(): void { this.view = 'join'; }

  invitePlayer(): void { this.$.peerCopypaste.openHostDialog(); }

  offer(offer: any, resolve: (resp: any) => void): void {
    this.$.peerCopypaste.handleOffer(offer.Offer).then((answer: string) => {
      resolve({Answer: answer});
    });
  }

  onMessage(msg: Net.Message, reliable: boolean, bytes: number) {
    if (this.settings.showMetrics) {
      this.$$('#metrics').recv(bytes);
    }

    this.debounce('host-timeout', () => {
      console.log('game: host timed out after', HOST_TIMEOUT / 1000, 'seconds');
      this.view = 'error';
      this.errorMsg = 'host timed out';
      this.disconnect();
    }, HOST_TIMEOUT);

    if (msg.welcome) {
      console.log('game: got welcome', msg.welcome.playerId);
      this.size = msg.welcome.galaxySize;
      this.playerId = msg.welcome.playerId;
      this.db = this.client.db;
      // Throw away initial changes so that we don't do a big unneccessary
      // notify on the first frame. The db object itself has just been set, so
      // every deep listener will already have been notified.
      this.db.changes();
      // Start the rendering loop.
      this.frame(0);
      this.connected = true;
      this.view = this.defaultStation;
      console.log(this.view, this.defaultStation);

    } else if (msg.receiveChat) {
      this.$.chat.receiveMsg(msg.receiveChat);
    }
  }

  sendChat(event: {detail: ChatEvent}): void {
    this.conn.send({sendChat: {text: event.detail.text}}, true);
  }

  joinCrew(event: {detail: Net.JoinCrew}): void {
    this.conn.send({joinCrew: event.detail}, true);
  }

  createShip(event: {detail: Net.CreateShip}): void {
    this.conn.send({createShip: {}}, true);
  }

  @listen('fire-weapon')
  fireWeapon(ev: any) {
    this.$.input.commands.fireWeapons.push(ev.detail);
  }

  @listen('start-left-turn')
  startLeftTurn() {
    this.$.input.startLeftTurn();
  }

  @listen('start-right-turn')
  startRightTurn() {
    this.$.input.startRightTurn();
  }

  @listen('stop-turn')
  stopTurn() {
    this.$.input.stopTurn();
  }

  @listen('power')
  power(ev: any) {
    this.$.input.commands.power[ev.detail.name] = ev.detail.level;
  }

  notifyChanges(update: Update): void {
    // Notify Polymer of changes in components for which elements may be
    // observing.
    if (update.components) {
      for (const com in update.components) {
        for (const id in update.components[com]) {
          this.notifyPath('db.' + com + '.' + id, this.db[com][id]);
          for (const prop in update.components[com][id]) {
            this.notifyPath(
                'db.' + com + '.' + id + '.' + prop, this.db[com][id][prop]);
          }
        }
      }
    }
  }

  frame(ts: number): void {
    this.animationRequestId = requestAnimationFrame(this.frame.bind(this));

    const elapsed = ts - this.prevTs;

    if (this.settings.frameLimit > 0 &&
        elapsed < 1000 / this.settings.frameLimit) {
      return;
    }

    if (this.settings.showMetrics && elapsed > 0) {
      this.$$('#metrics').draw(ts, elapsed);
    }

    let alpha = this.client.update(ts);
    if (!this.settings.interpolate) {
      alpha = 1;
    }

    const changes = this.db.changes();
    if (changes) {
      this.notifyChanges(changes);
    }

    this.shipId = this.db.players[this.playerId].shipId;
    const view = this.$.views.selectedItem;
    if (view && view.draw && this.shipId != null) {
      view.draw(alpha, alpha);
    }

    // Check for ship destruction.
    if (this.shipId && !this.db.ships[this.shipId]) {
      this.gameOver = true;
    }

    this.prevTs = ts;
  }
}
Game.register();
