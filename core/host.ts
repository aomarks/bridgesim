import {Connection} from '../net/connection';
import * as Net from '../net/message';
import * as Com from './components';
// Scenarios
import {Scenario, scenarios} from '../scenarios/scenarios';
// Entities
import {Db} from './entity/db';
import {SpawnShip} from './entity/ship';
// Systems
import {Ai} from './systems/ai';
import {Collision} from './systems/collision';
import {Death} from './systems/death';
import {Input} from './systems/input';
import {Laser} from './systems/laser';
import {Missile} from './systems/missile';
import {Motion} from './systems/motion';
import {Shields} from './systems/shields';
import {Station} from './systems/station';
import {Ftl} from './systems/ftl';

// How many command messages to store per player.
const COMMAND_BUFFER_SIZE = 100;

export interface System { tick(); }

export class Host {
  private db: Db = new Db();
  public settings: Com.Settings = this.db.newSettings(this.db.spawn());

  // Systems
  private collision = new Collision(this.db, this.settings.galaxySize);
  private systems: System[] = [
    this.collision,
    new Ai(this.db, this.settings.galaxySize, this.collision),
    new Death(this.db),
    new Input(this.db),
    new Laser(this.db),
    new Missile(this.db),
    new Ftl(this.db),
    new Motion(this.db, this.settings.galaxySize),
    new Shields(this.db),
    new Station(this.db),
  ];

  private conns: {[id: string]: Connection} = {};
  private timeoutId: number = null;
  private prevTs: number = 0;
  private tickLag: number = 0;
  private snapshotLag: number = 0;
  private snapshotStale: boolean = false;
  private seq: number = 0;
  private scenario: Scenario;

  public addConnection(conn: Connection) {
    const connId = this.db.spawn();
    this.conns[connId] = conn;
    console.log('host: connection added', connId);
    conn.onMessage = msg => { this.onMessage(connId, msg); };
    conn.onClose = () => {
      console.log('host: connection closed', connId);
      conn.onMessage = null;
      this.db.remove(connId);
      delete this.conns[connId];
      this.announce('player ' + connId + ' disconnected');
    };
  }

  public start() {
    console.log('host: starting');
    this.spawnShip('USS Default', 0, 0, false);
    this.tick();
  }

  public stop() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    for (let id in this.conns) {
      this.conns[id].close();
    }
    console.log('host: stopped');
  }

  private spawnShip(name: string, x: number, y: number, ai: boolean): string {
    return SpawnShip(this.db, name, x, y, ai);
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

      for (let system of this.systems) {
        system.tick();
      }

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
        this.snapshotLag >= this.settings.updateInterval) {
      const update = this.db.changes();
      if (update) {
        this.seq++;
        for (let id in this.db.players) {
          update.hostSeq = this.seq;
          update.clientSeq = this.db.players[id].latestSeq;
          this.conns[id].send({update: update}, false);
        }
        this.snapshotLag = 0;
        this.snapshotStale = false;
      }
    }

    this.prevTs = ts;
  }

  private announce(text: string) {
    this.broadcast(
        {receiveChat: {timestamp: Date.now(), announce: true, text: text}},
        true);
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
    } else if (msg.updateSettings) {
      this.onUpdateSettings(connId, msg.updateSettings);
    }
  }

  private onHello(connId: string, hello: Net.Hello) {
    const {shipId, station} = this.findFreeCrewSlot(hello.forceStation);
    const player = this.db.newPlayer(connId);
    player.name = hello.name;
    player.shipId = shipId;
    player.station = station;
    console.log('new player', connId, shipId, station);
    const snapshot = this.db.full();
    snapshot.hostSeq = this.seq;
    const welcome: Net.Welcome = {
      playerId: connId,
      snapshot: snapshot,
    };
    console.log('host: sending welcome', connId);
    this.conns[connId].send({welcome: welcome}, true);
    this.announce('player ' + player.name + ' (' + connId + ') joined');
  }

  private findFreeCrewSlot(forceStation: Net.Station):
      {shipId: string, station: Net.Station} {
    // TODO Move station list somewhere more global.
    const stations = [
      Net.Station.Helm,
      Net.Station.Engineering,
      Net.Station.Weapons,
      Net.Station.Science,
      Net.Station.Comms,
    ];

    for (const station of forceStation ? [forceStation] : stations) {
      for (const shipId in this.db.ships) {
        if (this.db.ais[shipId]) {
          continue;
        }
        let free = true;
        for (const playerId in this.db.players) {
          const player = this.db.players[playerId];
          if (player.shipId === shipId && player.station === station) {
            free = false;
            break;
          }
        }
        if (free) {
          return {
            shipId: shipId,
            station: station,
          };
        }
      }
    }

    // There are no free ships. Make a new one.
    // TODO Something better?
    return {
      shipId: this.spawnShip(null, 0, 0, false),
      station: forceStation != null ? forceStation : Net.Station.Helm,
    };
  }

  private onUpdatePlayer(connId: string, updatePlayer: Net.UpdatePlayer) {
    const player = this.db.players[connId];
    const oldName = player.name;
    player.name = updatePlayer.name;
    this.announce(
        'player ' + oldName + ' (' + connId + ') has changed their name to ' +
        player.name);
  }

  private onCreateShip(playerId: string, createShip: Net.CreateShip) {
    this.spawnShip(createShip.name, 0, 0, false);
  }

  private onJoinCrew(playerId: string, joinCrew: Net.JoinCrew) {
    console.log('joinCrew', playerId, JSON.stringify(joinCrew));
    const shipId = joinCrew.shipId;
    if (!this.db.ships[shipId]) {
      return;
    }
    const station = joinCrew.station;
    // TODO Check if occupied.
    const player = this.db.players[playerId];
    player.shipId = joinCrew.shipId;
    player.station = joinCrew.station;
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
    if (player.inputs.length == COMMAND_BUFFER_SIZE) {
      player.inputs.shift();
    }
    player.inputs.push(commands);
    player.latestSeq = commands.seq;
  }

  private onUpdateSettings(
      playerId: string, updateSettings: Net.UpdateSettings) {
    // TODO Only the host player should be allowed to update settings.

    if (updateSettings.scenarioName != null) {
      this.settings.scenarioName = updateSettings.scenarioName;
      for (const scenario of scenarios) {
        if (scenario.name === updateSettings.scenarioName) {
          this.scenario = scenario;
          break;
        }
      }
    }

    if (updateSettings.started && !this.settings.started) {
      if (this.scenario) {
        console.log('host: loading scenario', this.scenario.name);
        this.scenario.start(this.db);
      }
      this.settings.started = true

    } else if (updateSettings.started === false) {
      this.settings.started = false;
    }
  }
}
