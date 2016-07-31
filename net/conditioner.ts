import {Connection} from './connection';
import {Message} from './message';

// Simulates poor network conditions.
export class Conditioner implements Connection {
  // Milliseconds of artificial latency.
  latency: number = 0;

  // Rate [0,1] of artificially dropped messages (unreliable channel only).
  packetLoss: number = 0;

  onMessage: (msg: Message, reliable: boolean, bytes: number) => void;
  onOpen: () => void;
  onClose: () => void;
  private conn: Connection;
  private receiveTimeoutId: number = null;
  private sendTimeoutId: number = null;

  constructor(conn: Connection) {
    this.conn = conn;
    conn.onMessage = this.proxyOnMessage.bind(this);
    conn.onOpen = () => {
      if (this.onOpen) {
        this.onOpen();
      }
    };
    conn.onClose = () => {
      clearTimeout(this.receiveTimeoutId);
      clearTimeout(this.sendTimeoutId);
      if (this.onClose) {
        this.onClose();
      }
    };
  }

  proxyOnMessage(msg: Message, reliable: boolean, bytes: number): void {
    if (!this.onMessage) {
      return;
    }
    if (!reliable && Math.random() < this.packetLoss) {
      return;
    }
    if (this.latency > 0) {
      this.receiveTimeoutId = window.setTimeout(
          () => {this.onMessage(msg, reliable, bytes)}, this.latency);
    } else {
      this.onMessage(msg, reliable, bytes);
    }
  }

  send(msg: Message, reliable: boolean) {
    if (!reliable && Math.random() < this.packetLoss) {
      return;
    }
    if (this.latency > 0) {
      this.sendTimeoutId = window.setTimeout(
          () => {this.conn.send(msg, reliable)}, this.latency);
    } else {
      this.conn.send(msg, reliable);
    }
  }

  close(): void { this.conn.close(); }
}
