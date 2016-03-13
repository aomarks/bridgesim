///<reference path="message.ts" />

namespace Bridgesim.Net {

  export interface Connection {
    onMessage: (msg: Message) => void;
    onOpen: () => void;
    onClose: () => void;
    send(msg: Message, reliable: boolean);
    close();
  }
}
