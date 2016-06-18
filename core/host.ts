import * as Net from "../net/message";
import {Ai} from "./systems/ai";
import {Collision} from "./systems/collision";
import {Connection} from "../net/connection";
import {Db} from "./entity/db";
import {Input} from "./systems/input";
import {Laser} from "./systems/laser";
import {Missile} from "./systems/missile";
import {Motion} from "./systems/motion";
import {SpawnDebris, SpawnAstroidBelt} from "./entity/debris";
import {SpawnShip} from "./entity/ship";
import {SpawnStation} from "./entity/station";
import {Station} from "./systems/station";
import {randCoord} from "./galaxy";

export interface Settings {
  // The play field will have this many sectors across and down.
  galaxySize: number;

  // Milliseconds between simulation ticks.
  tickInterval: number;

  // Milliseconds between snapshot broadcasts.
  snapshotInterval: number;

  // How many command messages to store per player.
  commandBufferSize: number;
}

export class Host {
  private settings: Settings = {
    galaxySize: 12,
    tickInterval: 1000 / 30,
    snapshotInterval: 1000 / 15,
    commandBufferSize: 100,
  };

  private db: Db = new Db();
  private ai: Ai = new Ai(this.db);
  private input: Input = new Input(this.db);
  private motion: Motion = new Motion(this.db, this.settings.galaxySize);
  private laser: Laser = new Laser(this.db);
  private missile: Missile = new Missile(this.db);
  private collision: Collision = new Collision(this.db);
  private station: Station = new Station(this.db);

  private conns: {[id: string]: Connection} = {};
  private timeoutId: number;
  private prevTs: number = 0;
  private tickLag: number = 0;
  private snapshotLag: number = 0;
  private snapshotStale: boolean = false;

  private spawnShip(name: string, x: number, y: number, ai: boolean): string {
    const id = SpawnShip(this.db, name, x, y, ai);
    console.log('new ship', id);
    return id;
  }

  addConnection(conn: Connection) {
    const connId = this.db.spawn();  // TODO
    this.conns[connId] = conn;
    console.log('host: connection added', connId);
    conn.onMessage = msg => { this.onMessage(connId, msg); };
    conn.onClose = () => {
      console.log('host: connection closed', connId);
      this.db.remove(connId);
      delete this.conns[connId];
      this.broadcastRoster();
      this.announce('player ' + connId + ' disconnected');
    };
  }

  start() {
    console.log('host: starting');
    const rand = () => randCoord(this.settings.galaxySize);
    this.spawnShip('Mean', rand(), rand(), true);
    this.spawnShip('Neutral', rand(), rand(), true);
    this.spawnShip('Friendly', rand(), rand(), true);
    for (let i = 0; i < 2; i++) {
      SpawnStation(this.db, null, rand(), rand());
    }
    for (let i = 0; i < 5; i++) {
      SpawnAstroidBelt(this.db, rand(), rand(), rand(), rand());
    }
    this.tick();
  }

  stop() {
    if (this.timeoutId != null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    for (let id in this.conns) {
      this.conns[id].close();
    }
    console.log('host: stopped');
  }

  private broadcast(msg: Net.Message, reliable: boolean) {
    for (let id in this.db.players) {
      this.conns[id].send(msg, reliable);
    }
  }

  private tick() {
    this.timeoutId =
        setTimeout(this.tick.bind(this), this.settings.tickInterval);

    const ts = performance.now();
    const elapsed = ts - this.prevTs;
    this.tickLag += elapsed;
    this.snapshotLag += elapsed;

    const ticks = Math.floor(this.tickLag / this.settings.tickInterval);
    for (let i = 0; i < ticks; i++) {
      for (let playerId in this.db.players) {
        const player = this.db.players[playerId];
        if (player.shipId == null) {
          continue;
        }
        // Try to find the input that corresponded to this tick.
        const input = player.inputs[player.inputs.length - ticks + i];
        if (input) {
          const inputs = this.db.inputs[player.shipId];
          if (inputs != null) {
            inputs.push(input);
          }
        }
      }

      this.ai.tick();
      this.input.tick();
      this.motion.tick();
      this.laser.tick();
      this.missile.tick();
      this.collision.tick();
      this.station.tick();

      this.tickLag -= this.settings.tickInterval;
      this.snapshotStale = true;
    }

    if (ticks > 0) {
      // All useful input has been applied; clear buffers.
      for (let id in this.db.players) {
        this.db.players[id].inputs = [];
      }
    }

    if (this.snapshotStale &&
        this.snapshotLag >= this.settings.snapshotInterval) {
      const snapshot = this.takeSnapshot();
      for (let id in this.db.players) {
        snapshot.seq = this.db.players[id].latestSeq;
        this.conns[id].send({snapshot: snapshot}, false);
      }
      this.snapshotLag = 0;
      this.snapshotStale = false;
    }

    this.prevTs = ts;
  }

  private takeSnapshot(): Net.Snapshot {
    return {
      seq: 0,
      lasers: this.db.lasers,
      missiles: this.db.missiles,
      positions: this.db.positions,
      collidables: this.db.collidables,
      velocities: this.db.velocities,
      healths: this.db.healths,
      power: this.db.power,
      debris: this.db.debris,
      stations: this.db.stations,
    };
  }

  private announce(text: string) {
    this.broadcast(
        {receiveChat: {timestamp: Date.now(), announce: true, text: text}},
        true);
  }

  private broadcastRoster() {
    this.broadcast({roster: this.makeRoster()}, true);
  }

  private makeRoster(): Net.Roster {
    return {
      ships: this.db.ships,
      names: this.db.names,
      players: this.db.players,
      ais: this.db.ais
    };
  }

  private onMessage(connId: string, msg: Net.Message) {
    if (msg.hello) {
      this.onHello(connId, msg.hello);
    } else if (msg.sendChat) {
      this.onSendChat(connId, msg.sendChat);
    } else if (msg.commands) {
      this.onCommands(connId, msg.commands);
    } else if (msg.createShip) {
      this.onCreateShip(connId, msg.createShip);
    } else if (msg.joinCrew) {
      this.onJoinCrew(connId, msg.joinCrew);
    } else if (msg.updatePlayer) {
      this.onUpdatePlayer(connId, msg.updatePlayer);
    }
  }

  private onHello(connId: string, hello: Net.Hello) {
    const player = this.db.players[connId] = {
      name: hello.name,
      shipId: null,
      station: null,
      inputs: [],
      latestSeq: null,
    };
    const welcome: Net.Welcome = {
      playerId: connId,
      snapshot: this.takeSnapshot(),
      roster: this.makeRoster(),
      snapshotInterval: this.settings.snapshotInterval,
      tickInterval: this.settings.tickInterval,
      galaxySize: this.settings.galaxySize,
    };
    console.log('host: sending welcome', connId);
    this.conns[connId].send({welcome: welcome}, true);
    this.broadcastRoster();
    this.announce('player ' + player.name + ' (' + connId + ') joined');

    // TODO Don't create a ship for every player once client supports not
    // being assigned.
    const shipId = this.spawnShip('S' + connId, 0, 0, false);
    this.onJoinCrew(connId, {shipId: shipId, station: Net.Station.Helm});
  }

  private onUpdatePlayer(connId: string, updatePlayer: Net.UpdatePlayer) {
    const player = this.db.players[connId];
    const oldName = player.name;
    player.name = updatePlayer.name;
    this.announce(
        'player ' + oldName + ' (' + connId + ') has changed their name to ' +
        player.name);
    updatePlayer.playerId = connId;
    this.broadcast({updatePlayer: updatePlayer}, true);
  }

  private onCreateShip(playerId: string, createShip: Net.CreateShip) {
    this.spawnShip(null, 0, 0, false);
    this.broadcastRoster();
  }

  private onJoinCrew(playerId: string, joinCrew: Net.JoinCrew) {
    const shipId = joinCrew.shipId;
    if (!this.db.ships[shipId]) {
      return;
    }
    const station = joinCrew.station;
    // TODO Check if occupied.
    const player = this.db.players[playerId];
    player.shipId = joinCrew.shipId;
    player.station = joinCrew.station;
    this.broadcastRoster();
  }

  private onSendChat(connId: string, sendChat: Net.SendChat) {
    const name =
        this.db.players[connId] && this.db.players[connId].name || connId;
    const rc: Net.ReceiveChat = {
      timestamp: Date.now(),
      playerId: connId,
      name: name,
      text: sendChat.text,
    };
    this.broadcast({receiveChat: rc}, true);
  }

  private onCommands(playerId: string, commands: Net.Commands) {
    const player = this.db.players[playerId];
    if (commands.seq <= player.latestSeq) {
      // TODO Commands could legitimately arrive out of order.
      return;
    }
    if (player.inputs.length == this.settings.commandBufferSize) {
      player.inputs.shift();
    }
    player.inputs.push(commands);
    player.latestSeq = commands.seq;
  }
}
