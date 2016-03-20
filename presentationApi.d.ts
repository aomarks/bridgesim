interface Navigator {
  presentation: Presentation;
}

interface Presentation {
  defaultRequest: PresentationRequest;
  receiver: PresentationReceiver;
}

declare class PresentationRequest extends EventTarget {
  constructor(url: string);
  start(): Promise<PresentationConnection>;
  reconnect(presentationId: string): Promise<PresentationConnection>;
  getAvailability(): Promise<PresentationAvailability>;

  onconnectionavailable: EventHandler<PresentationConnectionAvailableEvent>;
}

interface PresentationReceiver {
  connectionList: Promise<PresentationConnectionList>;
}

type PresentationConnectionState =
  "connecting" |
  "connected" |
  "closed" |
  "terminated"
;

type BinaryType =
  "blob" |
  "arraybuffer"
;

interface EventHandler<T> {
  (event: T): void;
}

interface PresentationConnection extends EventTarget {
  id: string;
  state: PresentationConnectionState;
  close();
  terminate();
  onconnect: EventHandler<Event>;
  onclose: EventHandler<PresentationConnectionClosedEvent>;
  onterminate: EventHandler<Event>;

  // Communication
  binaryType: BinaryType;
  onmessage: EventHandler<MessageEvent>;

  send(message: string);
  send(data: Blob);
  send(data: ArrayBuffer);
  send(data: ArrayBufferView);
  addEventListener(type: 'connect', handler: EventHandler<Event>);
  addEventListener(type: 'close', handler: EventHandler<PresentationConnectionClosedEvent>);
  addEventListener(type: 'terminate', handler: EventHandler<Event>);
  addEventListener(type: 'message', handler: EventHandler<MessageEvent>);
}

type PresentationConnectionClosedReason =
    "error" |
    "closed" |
    "wentaway"
;

interface PresentationConnectionClosedEvent extends Event {
  reason: PresentationConnectionClosedReason;
  message: string;
}

interface PresentationConnectionClosedEventInit {
  reason: PresentationConnectionClosedReason;
  message: string;
}


interface PresentationConnectionList extends EventTarget {
  connections: PresentationConnection[];
  addEventListener(type: 'connectionavailable', handler: (event: PresentationConnectionAvailableEvent)=>void):void;
  onconnectionavailable: (event: PresentationConnectionAvailableEvent)=>void;
}

declare class PresentationConnectionAvailableEvent extends Event {
  constructor(type: string, eventInitDict: PresentationConnectionAvailableEventInit);

  connection: PresentationConnection;
}

interface PresentationConnectionAvailableEventInit {
    connection: PresentationConnection;
}

interface PresentationAvailability extends EventTarget {
  value: boolean;

  onchange: EventHandler<Event>;
  addEventListener(type: 'change', handler: EventHandler<Event>);
}
