import {Message} from './message';

export interface Connection {
  onMessage: (msg: Message, reliable: boolean, bytes: number) => void;
  onOpen: () => void;
  onClose: () => void;
  send(msg: Message, reliable: boolean): void;
  close(): void;
}
