///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {Client} from '../core/client';
import {Update} from '../core/comdb';
import {Db} from '../core/entity/db';
import {Conditioner} from '../net/conditioner';
import {Connection} from '../net/connection';
import * as Net from '../net/message';

import {ChatEvent} from './chat';
import {Settings} from './settings';

// Milliseconds to wait after we last heard from the host before we assume it's
// gone forever.
const HOST_TIMEOUT = 10 * 1000;

@component('bridgesim-game')
class Game extends polymer.Base {
  @property({type: Boolean, value: false}) hosting: boolean;
  @property({type: Boolean, value: false}) joining: boolean;
  @property({type: Boolean, value: false}) scanLocal: boolean;
  @property({type: Boolean, value: false}) connected: boolean;
  @property({type: Boolean, value: false}) started: boolean;
  @property({type: String, value: null}) token: string;
  @property({type: String, value: null}) errorMsg: string;
  @property({type: String, value: null}) loadingMsg: string;
  @property({type: String, value: null}) view: string;
  @property({type: String, value: null}) forceStation: Net.Station;
  @property({type: Boolean, value: false}) autoStart: boolean;
  @property({type: Object, value: ()=> { return {}; }}) views: any;
  @property({type: Number, value: 1}) size: number;

  @property({
    type: Object,
    value: ()=> {
      return {
        interpolate: true,
        fakeLatency: 0,
        fakePacketLoss: 0,
        frameLimit: 0,
        name: null,
        showBoundingBoxes: false,
        showQuadtree: false,
        showPathfinding: false,
        showMetrics: false,
        showMotion: false,
      };
    },
  })
  settings: Settings;

  @property({type: Object}) db: Db;

  @property({type: String}) urlHash: string;
  @property({type: Object}) urlParams: any;

  @property({type: Boolean, value: true}) serverHidden: boolean;
  @property({type: String}) playerId: string;
  @property({type: String}) shipId: string;

  private client: Client;
  private conn: Connection;
  private conditioner: Conditioner;
  private prevTs: number = 0;
  private urlQuery: string;
  private animationRequestId: number;

  ready(): void { console.log('game: ready'); }

  detached() { this.disconnect(); }

  disconnect() {
    console.log('game: disconnect');
    this.cancelDebouncer('host-timeout');
    cancelAnimationFrame(this.animationRequestId);

    if (this.client) {
      this.client.stop();
    }

    if (this.conn) {
      this.conn.onClose = null;  // Prevent loops.
      this.conn.close();
    }

    this.db = null;
    this.client = null;
    this.conn = null;
    this.conditioner = null;
    this.playerId = null;
    this.shipId = null;
    this.connected = false;
    this.started = false;
    this.hosting = false;
    this.joining = false;
    this.prevTs = 0;
  }

  /**
   * Observe changes to the URL hash. We use the URL hash as the primary
   * coordination point for top-level navigation. This makes history navigation
   * work trivially and is good for avoiding weird cycles.
   */
  @observe('urlHash')
  urlHashChanged(hash: string) {
    // Debounce because it takes a few ticks for the initial hash value to
    // settle, and so that we can make "inert" hash changes to avoid cycles.
    this.debounce('url-hash', () => {
      console.log('game: url hash:', hash);

      // Any top-level navigation implies a disconnect.
      if (this.connected) {
        this.disconnect();
      }

      if (!hash) {
        this.hosting = false;
        this.scanLocal = false;
        this.view = 'welcome';

      } else if (hash === 'host') {
        this.hosting = true;
        this.scanLocal = false;
        this.view = 'loading';
        this.loadingMsg = 'starting host';
        // The local storage system needs to know where to send offers. Set
        // this up async because the elements won't have been stamped out yet.
        // TODO Do this with data binding more cleanly.
        this.async(() => {
          const host = this.$$('#host');
          this.$$('#peerLocalstorage').takeOffer = host.onOffer.bind(host);
        });

      } else if (hash === 'local') {
        this.hosting = false;
        this.scanLocal = true;
        this.view = 'loading';
        this.loadingMsg = 'searching for local game';

      } else if (hash === 'join') {
        this.hosting = false;
        this.scanLocal = false;
        this.view = 'join';

      } else {
        this.hosting = false;
        this.scanLocal = false;
        this.view = 'join';
        this.token = hash;
        this.$.joinScreen.join();
      }
    }, 1);
  }

  /**
   * Set the URL hash, but without any of the effects that a normal navigation
   * would have. Useful for avoiding cycles when we're just updating the URL to
   * reflect state that has already changed.
   */
  @listen('url-hash-inert')
  onUrlHashInert(ev: {detail: string}) {
    this.urlHash = ev.detail;
    this.cancelDebouncer('url-hash');  // Disables urlHashChanged().
  }

  /**
   * Observe changes to URL parameters. Used for debug settings.
   */
  @observe('urlParams')
  urlParamsChanged(params: any) {
    if (params.station) {
      // TODO Move station map somewhere more global.
      this.forceStation = {
        helm: Net.Station.Helm,
        comms: Net.Station.Comms,
        science: Net.Station.Science,
        weapons: Net.Station.Weapons,
        engineering: Net.Station.Engineering,
      }[params.station];
    }
    if (params.autostart != null) {
      this.autoStart = true;
    }
    if (params.view) {
      this.view = params.view;
    }
    if (params.nolerp != null) {
      this.set('settings.interpolate', false);
    }
    if (params.metrics != null) {
      this.set('settings.showMetrics', true);
    }
  }

  @listen('show-welcome')
  onShowWelcome() {
    this.urlHash = '';
  }

  @property({computed: 'computeShowJoin(connecting, connected)'})
  showJoin: boolean;
  computeShowJoin(): boolean { return true; }

  @observe('view')
  viewChanged(view: string) {
    this.views = {[view]: true};
  }

  @observe('settings.fakeLatency')
  fakeLatencyChanged(val: number) {
    if (this.conditioner) {
      this.conditioner.latency = val;
    }
  }

  @observe('settings.fakePacketLoss')
  fakePacketLossChanged(val: number) {
    if (this.conditioner) {
      this.conditioner.packetLoss = val / 100;
    }
  }

  @observe('settings.name')
  nameChanged(name: string) {
    if (this.conn) {
      this.conn.send({updatePlayer: {name: name}}, true);
    }
  }

  @listen('loading')
  onLoading(ev: {detail: string}) {
    this.loadingMsg = ev.detail || 'loading';
    this.view = 'loading';
  }

  @listen('error-screen')
  onError(ev: {detail: string}) {
    this.errorMsg = ev.detail || 'unknown error';
    this.view = 'error';
  }

  @listen('connection')
  onConnection(event: {detail: Connection}): void {
    console.log('game: got connection');
    this.conditioner = new Conditioner(event.detail);
    this.conditioner.latency = this.settings.fakeLatency;
    this.conditioner.packetLoss = this.settings.fakePacketLoss;
    this.conn = this.conditioner;

    this.conn.onMessage = this.onMessage.bind(this);
    this.client =
        new Client(this.conn, this.$.input.process.bind(this.$.input));

    this.conn.onClose = () => {
      this.view = 'error';
      this.errorMsg = 'host disconnected';
      this.disconnect();
    };

    console.log('game: sending hello');
    this.conn.send(
        {
          hello: {
            name: this.settings.name,
            forceStation: this.forceStation,
          }
        },
        true);
  }

  hostGame(): void { this.urlHash = 'host'; }

  joinGame(): void { this.urlHash = 'join'; }

  invitePlayer(): void { this.$.peerCopypaste.openHostDialog(); }

  offer(offer: any, resolve: (resp: any) => void): void {
    this.$.peerCopypaste.handleOffer(offer.Offer).then((answer: string) => {
      resolve({Answer: answer});
    });
  }

  onMessage(msg: Net.Message, reliable: boolean, bytes: number) {
    if (this.settings.showMetrics) {
      this.$$('#metrics').recv(bytes);
    }

    this.debounce('host-timeout', () => {
      console.log('game: host timed out after', HOST_TIMEOUT / 1000, 'seconds');
      this.view = 'error';
      this.errorMsg = 'host timed out';
      this.disconnect();
    }, HOST_TIMEOUT);

    if (msg.welcome) {
      console.log('game: got welcome', msg.welcome.playerId);
      this.playerId = msg.welcome.playerId;
      this.db = this.client.db;
      this.connected = true;
      this.frame(0);
      if (this.hosting && this.autoStart) {
        this.conn.send({updateSettings: {started: true}}, true);
      }

    } else if (msg.receiveChat) {
      this.$.chat.receiveMsg(msg.receiveChat);
    }
  }

  @observe('db.settings.*')
  settingsChanged() {
    if (!this.db) {
      return;
    }
    const settings = this.db.findSettings();
    if (!settings) {
      return;
    }

    this.size = settings.galaxySize;
    this.token = settings.token;

    if (!settings.started) {
      this.started = false;
      this.view = 'lobby';

    } else if (!this.started) {
      this.started = true;
      // TODO Move station map somewhere more global.
      this.view = {
        [Net.Station.Helm]: 'helm',
        [Net.Station.Comms]: 'comms',
        [Net.Station.Science]: 'science',
        [Net.Station.Weapons]: 'weapons',
        [Net.Station.Engineering]: 'engineering',
      }[this.db.players[this.playerId].station || Net.Station.Helm];
    }
  }

  @listen('net-send')
  onNetSend(event: {detail: Net.Message}) {
    this.conn.send(event.detail, true);
  }

  @listen('input')
  applyInput(ev: any) {
    this.$.input.applyInput(ev.detail, false);
  }

  @listen('input-persistent')
  applyInputPersistent(ev: any) {
    this.$.input.applyInput(ev.detail, true);
  }

  // Notify Polymer of changes in components for which elements may be
  // observing.
  notifyChanges(update: Update): void {
    if (!update.components) {
      return;
    }

    let size = 0;
    for (const com in update.components) {
      for (const id in update.components[com]) {
        size++;
        for (const prop in update.components[com][id]) {
          size++;
        }
      }
    }

    if (size > 500) {
      // It will be slow to send this many notifications. Just nudge the whole
      // db binding so that everyone listening gets one notification.
      console.log('game: big update', size);
      const db = this.db;
      this.db = null;
      this.db = db;
      return;
    }

    for (const com in update.components) {
      for (const id in update.components[com]) {
        this.notifyPath('db.' + com + '.' + id, this.db[com][id]);
        for (const prop in update.components[com][id]) {
          this.notifyPath(
              'db.' + com + '.' + id + '.' + prop, this.db[com][id][prop]);
        }
      }
    }
  }

  frame(ts: number): void {
    this.animationRequestId = requestAnimationFrame(this.frame.bind(this));

    const elapsed = ts - this.prevTs;

    if (this.settings.frameLimit > 0 &&
        elapsed < 1000 / this.settings.frameLimit) {
      return;
    }

    if (this.settings.showMetrics && elapsed > 0) {
      this.$$('#metrics').draw(ts, elapsed);
    }

    let alpha = this.client.update(ts);
    if (!this.settings.interpolate) {
      alpha = 1;
    }

    const changes = this.db.changes();
    if (changes) {
      this.notifyChanges(changes);
    }

    this.shipId = this.db.players[this.playerId].shipId;
    const view = this.$.views.selectedItem;
    if (view && view.draw && this.shipId != null) {
      view.draw(alpha, alpha);
    }

    // Check for ship destruction.
    if (this.shipId && !this.db.ships[this.shipId]) {
      this.view = 'gameOver';
    }

    this.prevTs = ts;
  }
}
Game.register();
