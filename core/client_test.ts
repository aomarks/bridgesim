

import {expect} from 'chai';
import * as sinon from 'sinon';

import * as Com from './components';
import * as Msg from '../net/message';
import {Client} from './client';
import {Db} from './entity/db';
import {Loopback} from '../net/loopback';
import {Connection} from '../net/connection';

const FRAME = 10;
const TICK = 20;
const UPDATE = 40;

describe('client', () => {
  let clock;
  let db: Db;
  let cmd: Msg.Commands;
  let msgs: Msg.Message[];
  let client: Client;
  let con: Connection;

  beforeEach(() => {
    clock = sinon.useFakeTimers();

    db = new Db();
    cmd = {};
    msgs = [];

    const loopback = new Loopback();
    loopback.open();
    con = loopback.b;
    con.onMessage = (msg: Msg.Message) => { msgs.push(msg); };

    client = new Client(loopback.a, () => {return cmd});
  });

  afterEach(() => {
    client.stop();
    clock.restore();
  });

  it('should be initially not welcomed',
     () => { expect(client.welcomed).to.be.false; });

  describe('after welcome', () => {
    let id: string;
    let pos: Com.Position;
    let settings: Com.Settings;

    beforeEach(() => {
      id = db.spawn();
      pos = db.newPosition(id);
      db.newName(id).name = 'foo';
      settings = db.newSettings(db.spawn());
      settings.tickInterval = TICK;
      settings.updateInterval = UPDATE;

      const snapshot = db.full();
      snapshot.hostSeq = 0;
      con.send(
          {
            welcome: {
              playerId: 'foo',
              snapshot: snapshot,
            }
          },
          true);
    });

    it('should be welcomed', () => { expect(client.welcomed).to.be.true; });

    it('should apply initial snapshot', () => {
      expect(client.db.positions[id].x).to.equal(0);
      expect(client.lastHostSeq).to.equal(0);
    });

    it('should apply updates on update in host order', () => {
      pos.x = 1;
      const update1 = db.changes();
      update1.hostSeq = 1;

      pos.x = 2;
      const update2 = db.changes();
      update2.hostSeq = 2;

      // Send out of order.
      con.send({update: update2}, false);
      con.send({update: update1}, false);

      // Don't apply until we call update.
      expect(client.db.positions[id].x).to.equal(0);
      expect(client.lastHostSeq).to.equal(0);

      // Should be at update2, even though update1 came later.
      client.update(1);
      expect(client.db.positions[id].x).to.equal(2);
      expect(client.lastHostSeq).to.equal(2);
    });

    it('should not apply out of order updates', () => {
      pos.x = 2;
      const update2 = db.changes();
      update2.hostSeq = 2;
      con.send({update: update2}, false);

      // Still at 0 because we never received 1.
      client.update(1);
      expect(client.db.positions[id].x).to.equal(0);
      expect(client.lastHostSeq).to.equal(0);
    });

    it('should ignore obsolete updates', () => {
      pos.x = 1;
      const update1 = db.changes();
      update1.hostSeq = 1;

      pos.x = 2;
      const update2 = db.changes();
      update2.hostSeq = 2;

      con.send({update: update1}, false);
      con.send({update: update2}, false);
      client.update(1);
      con.send({update: update1}, false);
      client.update(1);

      // Should not have reverted to update1.
      expect(client.db.positions[id].x).to.equal(2);
      expect(client.lastHostSeq).to.equal(2);
    });

    it('should store previous positions', () => {
      expect(client.db.prevPositions[id].x).to.equal(0);

      pos.x = 1;
      const update1 = db.changes();
      update1.hostSeq = 1;
      con.send({update: update1}, false);
      client.update(1);
      expect(client.db.prevPositions[id].x).to.equal(0);

      pos.x = 2;
      const update2 = db.changes();
      update2.hostSeq = 2;
      con.send({update: update2}, false);
      client.update(1);
      expect(client.db.prevPositions[id].x).to.equal(1);

      pos.x = 3;
      const update3 = db.changes();
      update3.hostSeq = 3;
      con.send({update: update3}, false);
      client.update(1);
      expect(client.db.prevPositions[id].x).to.equal(2);
    });

    it('should delete previous position when position is deleted', () => {
      db.remove(id);
      const update = db.changes();
      update.hostSeq = 1;
      con.send({update: update}, false);
      client.update(1);
      expect(client.db.prevPositions[id]).to.be.undefined;
    });

    it('should send commands every tick interval', () => {
      expect(msgs).to.be.empty;

      clock.tick(TICK);
      expect(msgs).to.have.lengthOf(1);
      expect(msgs[0].commands.seq).to.equal(0);

      clock.tick(TICK - 1);
      expect(msgs).to.have.lengthOf(1);
      expect(msgs[0].commands.seq).to.equal(0);

      clock.tick(1);
      expect(msgs).to.have.lengthOf(2);
      expect(msgs[1].commands.seq).to.equal(1);
    });

    it('should compute remote alpha', () => {
      // Confirm our fake clock is ok.
      const now = Date.now;
      expect(now()).to.equal(0);

      // Zero right after initial snapshot.
      expect(client.update(now())).to.equal(0);

      // Render some frames before the next update arrives.
      clock.tick(FRAME);
      expect(client.update(now())).to.equal(.25);
      clock.tick(FRAME);
      expect(client.update(now())).to.equal(.5);
      clock.tick(FRAME);
      expect(client.update(now())).to.equal(.75);
      clock.tick(FRAME);
      expect(client.update(now())).to.equal(1);

      // Our update is late, so we just clamp to 1.
      clock.tick(FRAME);
      expect(client.update(now())).to.equal(1);

      // The update arrives, back to zero.
      pos.x = 1;
      const update = db.changes();
      update.hostSeq = 1;
      con.send({update: update}, false);
      expect(client.update(now())).to.equal(0);

      // One more frame. Expected update interval is based on the observed
      // update rate instead of the update rate claimed by the server. So we
      // are now expecting a longer delay until the next update than before,
      // hence alpha is lower (.2 vs .25), and we will draw a little closer to
      // update N-1 vs N.
      clock.tick(FRAME);
      expect(client.update(now())).to.equal(.2);
    });
  });
});
