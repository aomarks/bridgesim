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

@component('bridgesim-game')
class Game extends polymer.Base {
  @property({type: Boolean, value: false}) hosting: boolean;
  @property({type: Boolean, value: false}) scanLocal: boolean;
  @property({type: Boolean, value: false}) connecting: boolean;
  @property({type: Boolean, value: false}) connected: boolean;
  @property({type: Boolean, value: false}) gameOver: boolean;
  @property({type: String, value: ''}) token: string;
  @property({type: String, value: 'helm'}) station: string;
  @property({type: Object, value: ()=> { return {}; }}) stations: any;
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
  @property({type: String, value: 'engine'}) curSubsystem: string;

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
      this.connecting = true;

    } else {
      this.token = hash;
      this.connecting = true;
    }
  }

  @observe('urlParams')
  urlParamsChanged(params: any) {
    console.log('urlParamsChanged', params);
    if (params.station) {
      this.station = params.station;
    }
    if (params.nolerp != null) {
      this.set('settings.interpolate', false);
    }
  }

  @property({computed: 'computeShowWelcome(connecting, connected)'})
  showWelcome: boolean;
  computeShowWelcome(connecting: boolean, connected: boolean): boolean {
    return !connecting && !connected;
  }

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
      this.connecting = true;

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

  @observe('station')
  stationChanged(station: string) {
    this.stations = {[station]: true};
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

    this.conn.onClose = this.disconnect.bind(this);

    console.log('game: sending hello');
    this.conn.send({hello: {name: this.settings.name}}, true);
  }

  hostGame(): void { this.hosting = true; }

  joinGame(): void { this.$.peerCopypaste.openClientDialog(); }

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
      this.connecting = false;

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
    const station = this.$.stations.selectedItem;
    if (station && this.shipId != null) {
      if (station.draw) {
        station.draw(alpha, alpha);
      }
    }

    // Check for ship destruction.
    if (this.shipId && !this.db.ships[this.shipId]) {
      this.gameOver = true;
    }

    this.prevTs = ts;
  }
}
Game.register();
