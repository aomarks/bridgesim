///<reference path="../core/collision/collision-system.ts" />
///<reference path="../net/connection.ts" />
///<reference path="../net/message.ts" />
///<reference path="ship.ts" />
///<reference path="ai.ts" />

namespace Bridgesim.Core {

  export interface Settings {
    // Milliseconds between simulation ticks.
    tickInterval: number;

    // Milliseconds between snapshot broadcasts.
    snapshotInterval: number;

    // How many command messages to store per player.
    commandBufferSize: number;
  }

  export class Player {
    shipId: number;
    station: Net.Station;
    commands: Net.Commands[] = [];
    latestSeq: number = 0;

    constructor(public id: number, public name: string,
                public conn: Net.Connection) {}
  }

  export interface Tickable {
    tick();
  }

  export class Host {
    private settings: Settings = {
      tickInterval: 1000 / 30,
      snapshotInterval: 1000 / 15,
      commandBufferSize: 100,
    };
    private collisionSystem: Core.Collision.CollisionSystem = new Core.Collision.CollisionSystem();
    private players: Player[] = [];
    private conns: Net.Connection[] = [];
    private ships: Ship[] = [];
    private tickables: Tickable[] = [];
    private timeoutId: number;
    private prevTs: number = 0;
    private tickLag: number = 0;
    private snapshotLag: number = 0;
    private snapshotStale: boolean = false;

    constructor() {
      const mean = new Ship(this.ships.length, 'Mean', 0, 0, 0);
      this.ships.push(mean);
      this.tickables.push(new ShipAI(mean, -1, this.ships));
      const neutral = new Ship(this.ships.length, 'Neutral', 1, 1, 0);
      this.ships.push(neutral);
      this.tickables.push(new ShipAI(neutral, 0, this.ships));
      const friendly = new Ship(this.ships.length, 'Friendly', 2, 2, 0);
      this.ships.push(friendly);
      this.tickables.push(new ShipAI(friendly, 1, this.ships));
      this.broadcastRoster();
    }

    addConnection(conn: Net.Connection) {
      const connId = this.conns.length;
      this.conns.push(conn);
      conn.onMessage = msg => { this.onMessage(connId, msg); };
      conn.onClose = () => {
        const player = this.players[connId];
        if (player.shipId != null && player.station != null) {
          const ship = this.ships[player.shipId];
          ship.findAssignment(player.station).playerId = null;
        }
        delete this.players[connId];
        delete this.conns[connId];
        this.broadcastRoster();
        this.announce('player ' + connId + ' disconnected');
      };
    }

    start() { this.tick(); }

    stop() {
      if (this.timeoutId != null) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.conns.forEach(conn => conn.close());
    }

    private broadcast(msg: Net.Message, reliable: boolean) {
      this.players.forEach(player => { player.conn.send(msg, reliable); });
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
        for (let playerId in this.players) {
          const player = this.players[playerId];
          if (player.shipId == null) {
            continue
          }
          const ship = this.ships[player.shipId];
          const buffer = player.commands;
          // Try to find the input that corresponded to this tick.
          const commands = buffer[buffer.length - ticks + i];
          if (commands) {
            ship.applyCommands(commands);
          }
        }
        for (let tickable of this.tickables) {
          tickable.tick();
        }
        for (let ship of this.ships) {
          ship.tick();
        }
        this.collisionSystem.resolveCollisions(this.ships);
        this.tickLag -= this.settings.tickInterval;
        this.snapshotStale = true;
      }

      if (ticks > 0) {
        // All useful input has been applied; clear buffers.
        for (let playerId in this.players) {
          this.players[playerId].commands = [];
        }
      }

      if (this.snapshotStale &&
          this.snapshotLag >= this.settings.snapshotInterval) {
        const snapshot = this.takeSnapshot();
        this.players.forEach(player => {
          snapshot.seq = player.latestSeq;
          player.conn.send({snapshot: snapshot}, false);
        });
        this.snapshotLag = 0;
        this.snapshotStale = false;
      }

      this.prevTs = ts;
    }

    private takeSnapshot(): Net.Snapshot {
      const snapshot = {seq: 0, ships:<Net.ShipState[]>[]};
      for (let i = 0; i < this.ships.length; i++) {
        const ship = this.ships[i];
        snapshot.ships.push({
          shipId: i,
          x: ship.x,
          y: ship.y,
          heading: ship.heading,
          thrust: ship.thrust,
        });
      }
      return snapshot;
    }

    private announce(text: string) {
      this.broadcast(
          {receiveChat: {timestamp: Date.now(), announce: true, text: text}},
          true);
    }

    private broadcastRoster() {
      const roster: Net.Roster = {players: [], ships: []};
      this.players.forEach((player: Player) => {
        roster.players.push({id: player.id, name: player.name});
      });
      this.ships.forEach((ship) => {
        roster.ships.push({id: ship.id, name: ship.name, crew: ship.crew});
      });
      this.broadcast({roster: roster}, true);
    }

    private onMessage(connId: number, msg: Net.Message) {
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
      }
    }

    private onHello(connId: number, hello: Net.Hello) {
      const player = new Player(connId, 'P' + connId, this.conns[connId]);
      this.players[connId] = player;
      const welcome: Net.Welcome = {
        clientId: connId,
        snapshot: this.takeSnapshot(),
        snapshotInterval: this.settings.snapshotInterval,
        tickInterval: this.settings.tickInterval,
      };
      player.conn.send({welcome: welcome}, true);
      this.broadcastRoster();
      this.announce('player ' + connId + ' joined');

      // TODO Don't create a ship for every player once client supports not
      // being assigned.
      this.onCreateShip(connId, {});
      this.onJoinCrew(
          connId, {shipId: this.ships.length - 1, station: Net.Station.Helm});
    }

    private onCreateShip(playerId: number, createShip: Net.CreateShip) {
      const shipId = this.ships.length;
      this.ships.push(new Ship(shipId, 'S' + shipId, 0, 0, 0));
      this.broadcastRoster();
    }

    private onJoinCrew(playerId: number, joinCrew: Net.JoinCrew) {
      const shipId = joinCrew.shipId;
      const ship = this.ships[shipId];
      if (!ship) {
        return;
      }
      const station = joinCrew.station;
      if (ship.findAssignment(station).playerId != null) {
        return;  // Station occupied.
      }
      const player = this.players[playerId];
      if (player.shipId != null && player.station != null) {
        // Unassign existing station.
        this.ships[player.shipId].findAssignment(player.station).playerId =
            null;
      }
      player.shipId = joinCrew.shipId;
      player.station = joinCrew.station;
      ship.findAssignment(station).playerId = playerId;
      this.broadcastRoster();
    }

    private onSendChat(connId: number, sendChat: Net.SendChat) {
      const rc: Net.ReceiveChat = {
        timestamp: Date.now(),
        clientId: connId,
        text: sendChat.text,
      };
      this.broadcast({receiveChat: rc}, true);
    }

    private onCommands(playerId: number, commands: Net.Commands) {
      const player = this.players[playerId];
      if (commands.seq <= player.latestSeq) {
        // TODO Commands could legitimately arrive out of order.
        return;
      }
      if (player.commands.length == this.settings.commandBufferSize) {
        player.commands.shift();
      }
      player.commands.push(commands);
      player.latestSeq = commands.seq;
    }
  }
}
