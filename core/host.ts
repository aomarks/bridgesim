///<reference path="../net/connection.ts" />
///<reference path="../net/message.ts" />
///<reference path="ship.ts" />

namespace Bridgesim.Core {

  const TICK_MS = 1000 / 30;  // milliseconds per simulation tick
  const TICKS_PER_SNAPSHOT = 2;

  export class Host {
    private conns: Net.Connection[] = [];
    private active: Net.Connection[] = [];
    private ships: Ship[] = [];
    private conn2ship: {[connId: number]: Ship} = {};
    private conn2seq: {[connId: number]: number} = {};
    private players: {[playerId: number]: Net.Player} = {};
    private timeoutId: number;
    private seq = 0;

    private prevTs: number = 0;
    private lag: number = 0;

    addConnection(conn: Net.Connection) {
      const connId = this.conns.length;
      this.conns.push(conn);
      conn.onMessage = msg => { this.onMessage(connId, msg); };
      conn.onClose = () => {
        delete this.conns[connId];
        delete this.active[connId];
        delete this.players[connId];
        delete this.conn2seq[connId];
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
      this.timeoutId = setTimeout(this.tick.bind(this), TICK_MS);

      const ts = performance.now();
      const elapsed = ts - this.prevTs;
      this.lag += elapsed;

      while (this.lag >= TICK_MS) {
        for (let ship of this.ships) {
          ship.tick();
        }
        if (!(this.seq % TICKS_PER_SNAPSHOT)) {
          const snapshot = this.takeSnapshot();
          this.active.forEach((conn, connId) => {
            snapshot.seq = this.conn2seq[connId];
            conn.send({snapshot: snapshot}, false);
          });
        }
        this.lag -= TICK_MS;
        this.seq++;
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
      this.conn2ship[connId] = ship;
      this.conn2seq[connId] = 0;
      const welcome: Net.Welcome = {
        clientId: connId,
        shipId: shipId,
        snapshot: this.takeSnapshot(),
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
        return;
      }
      const ship = this.conn2ship[connId];
      ship.applyCommands(commands);
      this.conn2seq[connId] = commands.seq;
    }
  }
}
