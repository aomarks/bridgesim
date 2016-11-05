

import * as Com from './components';
import * as Msg from '../net/message';
import {Connection} from '../net/connection';
import {Db} from './entity/db';
import {Update} from './comdb';

// performance.now() is not available in node, so we need a substitute for unit
// tests.
let now;
try {
  performance.now();
  now = performance.now.bind(performance);
} catch (e) {
  // sinon will replace Date.now, so don't assign directly.
  now = () => { return Date.now(); }
}

export class Client {
  db: Db;

  // Whether the host has acknowledged us as a player yet.
  welcomed: boolean = false;

  // Buffer of host updates.
  private updates: Update[] = [];

  // Every command packet we send to the host has an incrementing sequence
  // number. The next one we'll send.
  private nextSeq: number = 0;

  // Every host update has an incrementing sequence number. The most recent one
  // we've received.
  lastHostSeq: number;

  // Every host update includes the latest command packet sequence number from
  // us that was integrated into the simulation.
  private lastIntegratedSeq: number;

  // Expected milliseconds between host update broadcasts.
  private updateInterval: number;

  // Millisecond timestamp when we last received a host update.
  private lastUpdateTime: number;

  private sendCommandsTimeout: number = null;

  private fwdMessages:
      (msg: Msg.Message, reliable: boolean, bytes: number) => void;

  private settings: Com.Settings;

  constructor(
      private con: Connection, private getCommands: () => Msg.Commands) {
    this.fwdMessages = con.onMessage;
    con.onMessage = this.onMessage.bind(this);
  }

  stop() {
    console.log('client: stopped');
    if (this.sendCommandsTimeout !== null) {
      clearTimeout(this.sendCommandsTimeout);
      this.sendCommandsTimeout = null;
    }
    this.con.onMessage = null;
  }

  private onMessage(msg: Msg.Message, reliable: boolean, bytes: number) {
    if (msg.welcome) {
      this.onWelcome(msg.welcome);
    } else if (msg.update) {
      this.onUpdate(msg.update);
    }

    if (this.fwdMessages) {
      this.fwdMessages(msg, reliable, bytes);
    }
  }

  private onWelcome(welcome: Msg.Welcome) {
    if (this.welcomed) {
      console.error('client: already welcomed');
      return;
    }

    // Immediately apply the initial database snapshot.
    this.db = new Db();
    this.db.apply(welcome.snapshot);
    this.settings = this.db.findSettings();
    if (!this.settings) {
      console.error('client: no settings object found');
      this.stop();
      return;
    }

    // Initialize previous positions for interpolation.
    this.savePrevPositions();

    this.lastHostSeq = welcome.snapshot.hostSeq;
    this.updateInterval = this.settings.updateInterval;
    this.lastUpdateTime = now();
    this.welcomed = true;
    this.sendCommandsTimeout =
        setTimeout(this.sendCommands.bind(this), this.settings.tickInterval);
  }

  private onUpdate(update: Update) {
    // Don't apply incremental updates until next tick. We don't want to update
    // the database e.g. while in the middle of rendering a frame.
    this.updates.push(update);
    // Although the host has told us its expected update interval, it might
    // sometimes drop, e.g. if it's starved because it's in a background tab.
    // Use the most recent actual update interval instead. This way our
    // interpolation alpha will adapt, and motion will appear more smooth.
    // TODO Consider a rolling average.
    const n = now();
    this.updateInterval = n - this.lastUpdateTime;
    this.lastUpdateTime = n;
  }

  private sendCommands() {
    this.sendCommandsTimeout =
        setTimeout(this.sendCommands.bind(this), this.settings.tickInterval);

    const commands = this.getCommands();
    commands.seq = this.nextSeq++;
    this.con.send({commands: commands}, false);
  }

  update(ts: number): number | undefined {
    if (!this.welcomed) {
      console.error('client: not welcomed');
      return undefined;
    }

    // Sort updates by host sequence number before applying. We might have
    // accrued multiple updates since last frame, and an unreliable WebRTC data
    // channel does not guarantee order.
    this.updates.sort(Client.compareHostSeq);

    // Apply all updates received since last frame.
    while (this.updates.length) {
      const update = this.updates[0];
      const age = update.hostSeq - this.lastHostSeq;

      if (age < 1) {
        // Ignore redundant or obsolete updates.
        this.updates.shift();
        continue;
      }

      if (age > 1) {
        // We did not receive one or more updates. We can't apply further
        // updates because they are deltas and corruption would occur.
        console.error('client: missed ' + (age - 1) + ' update(s)');
        // TODO Wait a few ticks to see if we will catch up, then tell the
        // server we need a re-sync.
        break;
      }

      // We interpolate between update N-1 and N, so store the current
      // positions before we apply this update.
      this.savePrevPositions();

      this.db.apply(update);
      this.lastHostSeq = update.hostSeq;
      this.lastIntegratedSeq = update.clientSeq;
      this.updates.shift();
    }

    return Math.min(1, (ts - this.lastUpdateTime) / this.updateInterval);
  }

  private static compareHostSeq(a: Update, b: Update): number {
    return a.hostSeq - b.hostSeq;
  }

  private savePrevPositions() {
    // Note that we can't only save the positions of entities that are moving
    // in the latest update. If an entity moved at N-1 but not at N, then its
    // previous position is now N-1, not N-2.
    for (const id in this.db.positions) {
      const pos = this.db.positions[id];
      let prev = this.db.prevPositions[id];
      if (!prev) {
        prev = this.db.newPrevPosition(id);
      }
      prev.x = pos.x;
      prev.y = pos.y;
      prev.yaw = pos.yaw;
      prev.roll = pos.roll;
    }
  }
}
