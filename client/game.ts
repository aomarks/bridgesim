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
  @property({type: Number, value: 1}) size: number;
  @property({type: Object}) settings: Settings;
  @property({type: Object}) routeData: {station: string};
  @property({type: Object}) db: Db;
  @property({type: Boolean, value: false}) isHost: boolean;
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
  private showStations: boolean;

  ready(): void {
    console.log('game: ready');

    this.settings = {
      interpolate: true,
      fakeLatency: 0,
      fakePacketLoss: 0,
      frameLimit: 0,
      name: null,
      showBoundingBoxes: false,
      showQuadtree: false,
      showPathfinding: false,
      showMetrics: true,
    };

    if (this.urlQuery.indexOf('host') != -1) {
      this.isHost = true;
    } else if (this.urlQuery.indexOf('client') != -1) {
      this.$.peerLocalstorage.makeOffer();
    }

    if (!window.location.hash || !this.isHost) {
      // TODO Why doesn't iron-location hash binding work?
      // TODO Is there some smarter way to do this using the route?
      if (this.isHost) {
        this.switchToStation();
      } else {
        window.location.hash = '/welcome';
      }
    }
  }

  detached() {
    if (this.client) {
      this.client.stop();
    }
  }

  openSettingsDialog(): void { this.$.settingsDialog.open(); }

  openLobbyDialog(): void { this.$.lobbyDialog.open(); }

  @observe('isHost')
  isHostChanged(isHost: boolean): void {
    this.resetSimulation();
    this.resetNetwork();
    if (isHost) {
      // TODO Ugly.
      this.async(() => {
        const host = this.$$('#host');
        this.$.peerLocalstorage.takeOffer = host.onOffer.bind(host);
      });
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

  @observe('settings.name')
  nameChanged(name: string) {
    if (this.conn) {
      this.conn.send({updatePlayer: {name: name}}, true);
    }
  }

  resetSimulation() {
    if (this.animationRequestId != null) {
      cancelAnimationFrame(this.animationRequestId);
      this.animationRequestId = null;
    }
    this.shipId = null;
    this.prevTs = 0;
    console.log('game: reset simulation');
  }

  resetNetwork() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    this.playerId = null;
    console.log('game: reset network');
  }

  @listen('connection')
  onConnection(event: {detail: Connection}): void {
    this.conditioner = new Conditioner(event.detail);
    this.conditioner.latency = this.settings.fakeLatency;
    this.conditioner.packetLoss = this.settings.fakePacketLoss;
    this.conn = this.conditioner;

    this.conn.onMessage = this.onMessage.bind(this);
    this.client =
        new Client(this.conn, this.$.input.process.bind(this.$.input));

    this.conn.onClose = () => {
      console.log('game: disconnected from host');
      this.resetSimulation();
    };

    console.log('game: sending hello');
    this.conn.send({hello: {name: this.settings.name}}, true);

    this.switchToStation();
  }

  switchToStation(station: string = 'helm'): void {
    window.location.hash = '/station/' + station;
  }

  hostGame(): void {
    this.isHost = true;
    this.switchToStation();
  }

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
    if (this.shipId && !this.db.ships[this.shipId] && this.showStations) {
      window.location.hash = '/gameover';
    }

    this.prevTs = ts;
  }
}
Game.register();
