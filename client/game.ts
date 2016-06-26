///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {Update} from '../core/comdb';
import {Position} from '../core/components';
import {Db} from '../core/entity/db';
import {Host} from '../core/host';
import {Input} from '../core/systems/input';
import {Motion} from '../core/systems/motion';
import {Conditioner} from '../net/conditioner';
import {Connection} from '../net/connection';
import {Loopback} from '../net/loopback';
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

  private host: Host;
  private conn: Connection;
  private conditioner: Conditioner;
  private motion: Motion;
  private input: Input;
  private latestSnapshotMs: number = 0;
  private latestSeq = -1;
  private seq: number = 0;
  private commandBuffer: Net.Commands[] = [];
  private prevTs: number = 0;
  private lag: number = 0;
  private urlQuery: string;
  private animationRequestId: number;
  private welcomed: boolean;
  private showStations: boolean;
  private updateBuffer: Update[] = [];

  ready(): void {
    console.log('game: ready');

    this.settings = {
      // TODO Re-enable prediction once it works with deltas.
      localPredict: false,
      localInterpolate: true,
      remoteInterpolate: true,
      fakeLatency: 0,
      fakePacketLoss: 0,
      frameLimit: 0,
      tickInterval: 0,      // Server controlled.
      snapshotInterval: 0,  // Server controlled.
      commandBufferSize: 100,
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

  openSettingsDialog(): void { this.$.settingsDialog.open(); }

  openLobbyDialog(): void { this.$.lobbyDialog.open(); }

  closeHostIDToast(): void { this.$.hostIDToast.close(); }

  @observe('isHost')
  isHostChanged(isHost: boolean): void {
    this.resetSimulation();
    this.resetNetwork();
    if (isHost) {
      this.host = new Host();
      this.host.start();

      const loopback = new Loopback();
      this.conn = loopback.a;
      this.setupConn();
      this.host.addConnection(loopback.b);
      console.log('game: opening loopback connection');
      loopback.open();

      setTimeout(
          () => { this.$$('#lobbyHost').offer = this.offer.bind(this); }, 1);

      this.$.hostIDToast.open();
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
    this.updateBuffer = [];
    this.latestSeq = -1;
    this.prevTs = 0;
    this.lag = 0;
    this.welcomed = false;
    this.db = new Db();
    this.motion = null;
    this.input = new Input(this.db);
    console.log('game: reset simulation');
  }

  resetNetwork() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.host) {
      this.host.stop();
      this.host = null;
    }
    this.playerId = null;
    console.log('game: reset network');
  }

  onConnection(event: {detail: Connection}): void {
    if (this.isHost) {
      this.host.addConnection(event.detail);
    } else {
      this.conn = event.detail;
      this.setupConn();
      this.switchToStation();
    }
  }

  setupConn() {
    this.conditioner = new Conditioner(this.conn);
    this.conditioner.latency = this.settings.fakeLatency;
    this.conditioner.packetLoss = this.settings.fakePacketLoss;
    this.conn = this.conditioner;

    this.conn.onMessage = this.onMessage.bind(this);
    this.conn.onClose = () => {
      console.log('game: disconnected from host');
      this.resetSimulation();
    };

    console.log('game: sending hello');
    this.conn.send({hello: {name: this.settings.name}}, true);
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
      this.motion = new Motion(this.db, this.size);
      this.settings.tickInterval = msg.welcome.tickInterval;
      this.settings.snapshotInterval = msg.welcome.snapshotInterval;
      this.playerId = msg.welcome.playerId;
      this.applyUpdate(msg.welcome.snapshot);
      this.welcomed = true;
      this.frame(0);

    } else if (msg.receiveChat) {
      this.$.chat.receiveMsg(msg.receiveChat);

    } else if (msg.update) {
      this.updateBuffer.push(msg.update);
      this.latestSnapshotMs = performance.now();
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

  applyUpdate(update: Update): void {
    // Copy previous positions for interpolation.
    // TODO Something smarter.
    if (update.components) {
      if (update.components['positions']) {
        const positions = update.components['positions'];
        for (const id in positions) {
          let prev = this.db.prevPositions[id];
          if (!prev) {
            prev = this.db.prevPositions[id] = new Position();
          }
          let cur = this.db.positions[id];
          if (!cur) {
            cur = positions[id];
          }
          prev.x = cur.x;
          prev.y = cur.y;
          prev.roll = cur.roll;
          prev.yaw = cur.yaw;
        }
      }
    }

    this.db.apply(update);
    this.shipId = this.db.players[this.playerId].shipId;

    // Many elements are observing the top-level component map, e.g. the crew
    // selection screen listens on the ships and players map changing (the map
    // itself, not its contents). To make this work with the current code, we
    // need to clone some of the component maps so that the changes propagate.
    //
    // TODO Refactor elements to listen deeper (i.e. not on the component map
    // itself changing), and notify correctly through Polymer. Or figure out
    // some different notification system if Polymer's is not powerful enough
    // here.
    const clone = [
      'ais',
      'healths',
      'names',
      'players',
      'positions',
      'power',
      'resources',
      'ships',
      'stations',
    ];
    for (const component of clone) {
      const clone = {};
      for (const id in this.db[component]) {
        clone[id] = this.db[component][id];
      }
      this.set('db.' + component, clone);
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

    this.updateBuffer.sort(function(a: Update, b: Update) {
      return a.hostSeq - b.hostSeq;
    });

    while (this.updateBuffer.length) {
      const update = this.updateBuffer.shift();
      this.applyUpdate(update);
      // TODO Prediction is broken with deltas.
      if (this.settings.localPredict && this.shipId != null &&
          !this.updateBuffer.length) {
        const offset = this.seq - update.clientSeq;
        const length = this.commandBuffer.length;
        for (let i = length - offset + 1; i < length; i++) {
          const commands = this.commandBuffer[i];
          if (commands) {
            this.input.apply(this.shipId, commands, false);
          }
          // Make sure the ship exists before ticking the motion.
          if (this.db.velocities[this.shipId]) {
            this.motion.tickOne(this.shipId);
          }
        }
      }
    }

    this.lag += elapsed;

    let commands: Net.Commands;
    while (this.lag >= this.settings.tickInterval) {
      commands = this.$.input.process();
      commands.seq = this.seq;
      if (this.commandBuffer.length === this.settings.commandBufferSize) {
        this.commandBuffer.shift();
      }
      this.commandBuffer.push(commands);

      if (this.settings.localPredict && this.shipId != null) {
        this.input.apply(this.shipId, commands, false);
        // Make sure the ship exists before ticking the motion.
        if (this.db.velocities[this.shipId]) {
          this.motion.tickOne(this.shipId);
        }
      }
      this.lag -= this.settings.tickInterval;
      this.seq++;
    }
    if (commands) {
      this.conn.send({commands: commands}, false);
    }

    const station = this.$.stations.selectedItem;
    if (station && this.shipId != null) {
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

      if (station.draw) {
        station.draw(localAlpha, remoteAlpha);
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
