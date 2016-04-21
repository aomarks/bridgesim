///<reference path="../net/connection.ts" />
///<reference path="../net/message.ts" />
///<reference path="ship.ts" />

namespace Bridgesim.Core {

  export interface Settings {
    // Milliseconds between simulation ticks.
    tickInterval: number;

    // Milliseconds between snapshot broadcasts.
    snapshotInterval: number;

    // How many command messages to store per player.
    commandBufferSize: number;
  }

  export class Host {
    private settings: Settings = {
      tickInterval: 1000 / 30,
      snapshotInterval: 1000 / 15,
      commandBufferSize: 100,
    };

    private conns: Net.Connection[] = [];
    private active: Net.Connection[] = [];
    private ships: Ship[] = [];
    private conn2seq: {[connId: number]: number} = {};
    private players: {[playerId: number]: Net.Player} = {};
    private conn2commands: {[connId: number]: Net.Commands[]} = {};
    private timeoutId: number;

    private prevTs: number = 0;
    private tickLag: number = 0;
    private snapshotLag: number = 0;
    private snapshotStale: boolean = false;

    addConnection(conn: Net.Connection) {
      const connId = this.conns.length;
      this.conns.push(conn);
      conn.onMessage = msg => { this.onMessage(connId, msg); };
      conn.onClose = () => {
        delete this.conns[connId];
        delete this.active[connId];
        delete this.players[connId];
        delete this.conn2seq[connId];
        delete this.conn2commands[connId];
        this.broadcastPlayerList();
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
      this.active.forEach(conn => { conn.send(msg, reliable); });
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
        for (let shipId in this.ships) {
          const ship = this.ships[shipId];
          const buffer = this.conn2commands[shipId];
          // Try to find the input that corresponded to this tick.
          const commands = buffer[buffer.length - ticks + i];
          if (commands) {
            ship.applyCommands(commands);
          }
          ship.tick();
        }
        this.tickLag -= this.settings.tickInterval;
        this.snapshotStale = true;
      }

      if (ticks > 0) {
        // All useful input has been applied; clear buffers.
        for (let connId in this.conn2commands) {
          this.conn2commands[connId] = [];
        }
      }

      if (this.snapshotStale &&
          this.snapshotLag >= this.settings.snapshotInterval) {
        const snapshot = this.takeSnapshot();
        this.active.forEach((conn, connId) => {
          snapshot.seq = this.conn2seq[connId];
          conn.send({snapshot: snapshot}, false);
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

    private broadcastPlayerList() {
      const players: Net.Player[] = [];
      for (let id in this.players) {
        players.push(this.players[id]);
      }
      this.broadcast({playerList: {players: players}}, true);
    }

    private onMessage(connId: number, msg: Net.Message) {
      if (msg.hello) {
        this.onHello(connId, msg.hello);
      } else if (msg.sendChat) {
        this.onSendChat(connId, msg.sendChat);
      } else if (msg.commands) {
        this.onCommands(connId, msg.commands);
      }
    }

    private onHello(connId: number, hello: Net.Hello) {
      const shipId = this.ships.length;
      const ship = new Ship(shipId.toString(), 0, 0, 0);
      this.ships.push(ship);
      this.conn2seq[connId] = 0;
      this.conn2commands[connId] = [];
      const welcome: Net.Welcome = {
        clientId: connId,
        shipId: shipId,
        snapshot: this.takeSnapshot(),
        snapshotInterval: this.settings.snapshotInterval,
        tickInterval: this.settings.tickInterval,
      };
      const msg = {welcome: welcome};
      this.conns[connId].send(msg, true);
      this.active[connId] = this.conns[connId];
      this.players[connId] = {id: connId, name: connId.toString()};
      this.broadcastPlayerList();
      this.announce('player ' + connId + ' joined');
    }

    private onSendChat(connId: number, sendChat: Net.SendChat) {
      const rc: Net.ReceiveChat = {
        timestamp: Date.now(),
        clientId: connId,
        text: sendChat.text,
      };
      this.broadcast({receiveChat: rc}, true);
    }

    private onCommands(connId: number, commands: Net.Commands) {
      if (commands.seq <= this.conn2seq[connId]) {
        // TODO Commands could legitimately arrive out of order.
        return;
      }
      const buffer = this.conn2commands[connId];
      if (buffer.length == this.settings.commandBufferSize) {
        buffer.shift();
      }
      buffer.push(commands);
      this.conn2seq[connId] = commands.seq;
    }
  }
}
