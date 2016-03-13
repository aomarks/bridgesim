///<reference path="connection.ts" />
///<reference path="message.ts" />

namespace Bridgesim.Net {

  const NET_TICK = 1000 / 30;  // milliseconds per network tick

  export class Host {
    private conns: Connection[] = [];
    private active: Connection[] = [];
    private ships: Update[] = [];
    private conn2ship: {[connId: number]: Update} = {};
    private timeoutId: number;

    addConnection(conn: Connection) {
      const connId = this.conns.length;
      this.conns.push(conn);
      conn.onMessage = msg => { this.onMessage(connId, msg); };
      conn.onClose = () => {
        delete this.conns[connId];
        delete this.active[connId];
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

    private broadcast(msg: Message, reliable: boolean) {
      this.active.forEach(conn => { conn.send(msg, reliable); });
    }

    private tick() {
      this.timeoutId = setTimeout(this.tick.bind(this), NET_TICK);
      this.broadcast({type: Type.Sync, sync: {updates: this.ships}}, false);
    }

    private onMessage(connId: number, msg: Message) {
      if (msg.type == Type.Hello) {
        this.onHello(connId, msg.hello);
      } else if (msg.type == Type.SendChat) {
        this.onSendChat(connId, msg.sendChat);
      } else if (msg.type == Type.Update) {
        this.onUpdate(connId, msg.update);
      }
    }

    private onHello(connId: number, hello: Hello) {
      const shipId = this.ships.length;
      const ship = {shipId: shipId, x: 0, y: 0, heading: 0, thrust: 0};
      this.ships.push(ship);
      this.conn2ship[connId] = ship;
      const welcome: Welcome = {
        clientId: connId,
        shipId: shipId,
        updates: this.ships,
      };
      const msg = {type: Type.Welcome, welcome: welcome};
      this.conns[connId].send(msg, true);
      this.active[connId] = this.conns[connId];
    }

    private onSendChat(connId: number, sendChat: SendChat) {
      const rc: ReceiveChat = {
        timestamp: Date.now(),
        clientId: connId,
        text: sendChat.text,
      };
      this.broadcast({type: Type.ReceiveChat, receiveChat: rc}, true);
    }

    private onUpdate(connId: number, update: Update) {
      const ship = this.conn2ship[connId];
      ship.x = update.x;
      ship.y = update.y;
      ship.heading = update.heading;
      ship.thrust = update.thrust;
    }
  }
}
