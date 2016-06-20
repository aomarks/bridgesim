import {Connection} from './connection';
import {Message} from './message';

/** Pass messages between two local connections. */
export class Loopback {
  a: Connection;
  b: Connection;

  constructor() {
    const a = this.a = new LoopbackConnection();
    const b = this.b = new LoopbackConnection();
    a.receiver = b;
    b.receiver = a;
  }

  open() {
    (<LoopbackConnection>this.a).open = true;
    (<LoopbackConnection>this.b).open = true;
    if (this.a.onOpen) {
      this.a.onOpen();
    }
    if (this.b.onOpen) {
      this.b.onOpen();
    }
  }
}

class LoopbackConnection implements Connection {
  onMessage: (msg: Message, reliable: boolean, bytes: number) => void;
  onOpen: () => void;
  onClose: () => void;
  receiver: LoopbackConnection;
  open = false;

  send(msg: Message, reliable: boolean) {
    if (!this.open) {
      console.error('connection closed');
      return;
    }
    if (this.receiver.onMessage) {
      // Make a copy so that we don't accidentally share memory.
      const copy = JSON.stringify(msg);
      // TODO We don't have any actual network traffic bytes to report, but
      // let's pretend we're doing UTF-8 JSON over WebRTC.
      const bytes = copy.length;
      this.receiver.onMessage(JSON.parse(copy), reliable, bytes);
    }
  }

  close() {
    this.open = false;
    if (this.receiver.open) {
      this.receiver.close()
    }
    if (this.onClose) {
      this.onClose();
    }
  }
}
