///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import * as Net from "../net/message";
import {ChatEvent} from "./chat";
import {Conditioner} from "../net/conditioner";
import {Connection} from "../net/connection";
import {Db} from "../core/entity/db";
import {Host} from "../core/host";
import {Input} from "../core/systems/input";
import {Loopback} from "../net/loopback";
import {Motion} from "../core/systems/motion";
import {Settings} from "./settings";

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
  @property({type: Number, value: 0.8}) zoom: number;
  @property({type: Number, value: 0}) panX: number;
  @property({type: Number, value: 0}) panY: number;

  private host: Host;
  private conn: Connection;
  private conditioner: Conditioner;
  private motion: Motion;
  private input: Input;
  private latestSnapshot: Net.Snapshot;
  private latestSnapshotMs: number = 0;
  private latestSeq = -1;
  private seq: number = 0;
  private commandBuffer: Net.Commands[] = [];
  private prevTs: number = 0;
  private lag: number = 0;
  private urlQuery: string;
  private animationRequestId: number;
  private welcomed: boolean;

  ready(): void {
    console.log('game: ready');

    this.settings = {
      localPredict: true,
      localInterpolate: true,
      remoteInterpolate: true,
      fakeLatency: 0,
      fakePacketLoss: 0,
      tickInterval: 0,      // Server controlled.
      snapshotInterval: 0,  // Server controlled.
      commandBufferSize: 100,
      name: null,
      showBoundingBoxes: false,
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
          () => { this.$$("#lobbyHost").offer = this.offer.bind(this); }, 1);

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
    this.latestSnapshot = null;
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

  switchToStation(station: string = "helm"): void {
    window.location.hash = "/station/" + station;
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

  onMessage(msg: Net.Message) {
    if (msg.welcome) {
      console.log('game: got welcome', msg.welcome.playerId);
      this.size = msg.welcome.galaxySize;
      this.motion = new Motion(this.db, this.size);
      this.settings.tickInterval = msg.welcome.tickInterval;
      this.settings.snapshotInterval = msg.welcome.snapshotInterval;
      this.playerId = msg.welcome.playerId;
      this.applyRoster(msg.welcome.roster);
      this.applySnapshot(msg.welcome.snapshot);
      this.welcomed = true;
      this.frame(0);

    } else if (!this.welcomed) {
      return;

    } else if (msg.roster) {
      console.log('game: got roster');
      this.applyRoster(msg.roster);

    } else if (msg.receiveChat) {
      this.$.chat.receiveMsg(msg.receiveChat);

    } else if (msg.snapshot) {
      if (msg.snapshot.seq > this.latestSeq) {
        this.latestSnapshotMs = performance.now();
        this.latestSnapshot = msg.snapshot;
        this.latestSeq = msg.snapshot.seq;
      }
    } else if (msg.updatePlayer) {
      const updatePlayer = msg.updatePlayer;
      const player = this.db.players[updatePlayer.playerId];
      if (updatePlayer.name) {
        player.name = updatePlayer.name;
      }
    }
  }

  applyRoster(roster: Net.Roster) {
    this.set('db.ships', roster.ships);
    this.set('db.ais', roster.ais);
    this.set('db.names', roster.names);
    this.set('db.players', roster.players);
    for (let playerId in this.db.players) {
      if (playerId === this.playerId) {
        this.shipId = this.db.players[playerId].shipId;
      }
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

  applySnapshot(snapshot: Net.Snapshot): void {
    this.set('db.healths', snapshot.healths);
    this.db.lasers = snapshot.lasers;
    this.db.missiles = snapshot.missiles;
    this.db.prevPositions = this.db.positions;
    this.db.positions = snapshot.positions;
    this.db.collidables = snapshot.collidables;
    this.db.velocities = snapshot.velocities;
    this.db.power = snapshot.power;
    this.db.debris = snapshot.debris;
    this.set('db.stations', snapshot.stations);
    this.set('db.resources', snapshot.resources);
  }

  frame(ts: number): void {
    this.animationRequestId = requestAnimationFrame(this.frame.bind(this));

    if (this.latestSnapshot) {
      this.applySnapshot(this.latestSnapshot);
      if (this.settings.localPredict && this.shipId != null) {
        const offset = this.seq - this.latestSnapshot.seq;
        const length = this.commandBuffer.length;
        for (let i = length - offset + 1; i < length; i++) {
          const commands = this.commandBuffer[i];
          if (commands) {
            this.input.apply(this.shipId, commands, false);
          }
          this.motion.tickOne(this.shipId);
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

      if (this.settings.localPredict && this.shipId != null) {
        this.input.apply(this.shipId, commands, false);
        this.motion.tickOne(this.shipId);
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

      station.draw(localAlpha, remoteAlpha);
    }

    this.prevTs = ts;
  }
}
Game.register();
