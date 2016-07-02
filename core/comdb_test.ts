///<reference path="../typings/index.d.ts" />

import {expect} from 'chai';

import {Component, Database} from './comdb';

class A extends Component {
  @Component.prop x: number = 0;
  @Component.prop y: number = 0;
}

class B extends Component {
  @Component.prop foo: string = '';
}

describe('Component', () => {
  let a: A;
  beforeEach(() => { a = new A(); });

  it('should get default values', () => {
    expect(a.x).to.equal(0);
    expect(a.y).to.equal(0);
  });

  it('should be initially changed', () => {
    expect(a.changed).to.be.true;
    expect(a.change).to.deep.equal({x: 0, y: 0});
  });

  it('should clear changes', () => {
    a.clearChange();
    expect(a.changed).to.be.false;
    expect(a.change).to.deep.equal({});
  });

  it('should notice changes', () => {
    a.clearChange();

    a.x = 1;
    expect(a.changed).to.be.true;
    expect(a.change).to.deep.equal({x: 1});

    a.y = 2;
    expect(a.changed).to.be.true;
    expect(a.change).to.deep.equal({x: 1, y: 2});

    a.x = 3;
    expect(a.changed).to.be.true;
    expect(a.change).to.deep.equal({x: 3, y: 2});

    a.clearChange();
    expect(a.changed).to.be.false;
    expect(a.change).to.deep.equal({});
  });

  it('should ignore equality changes', () => {
    a.clearChange();

    a.x = 0;
    expect(a.changed).to.be.false;
    expect(a.change).to.deep.equal({});
  });

  it('should generate full snapshot', () => {
    expect(a.full()).to.deep.equal({x: 0, y: 0});
    a.clearChange();
    expect(a.full()).to.deep.equal({x: 0, y: 0});
    a.x = 1;
    expect(a.full()).to.deep.equal({x: 1, y: 0});
  });
});

class TestDb extends Database {
  @Database.table(A) a: {[id: string]: A} = {};
  newA(id: string): A { return this['newA_'](id); }

  @Database.table(B) b: {[id: string]: B} = {};
  newB(id: string): B { return this['newB_'](id); }
}

describe('Database', () => {
  let db: TestDb;

  beforeEach(() => { db = new TestDb(); });

  it('should create sequential ids', () => {
    expect(db.spawn()).to.equal('0');
    expect(db.spawn()).to.equal('1');
    expect(db.spawn()).to.equal('2');
  });

  it('should have newFoo_ helpers', () => {
    const id = db.spawn();
    db.newA(id);
    db.newB(id);
    expect(db.a[id]).to.be.an.instanceof (A);
    expect(db.b[id]).to.be.an.instanceof (B);
  });

  it('should remove entity', () => {
    const id = db.spawn();
    db.newA(id);
    db.newB(id);
    db.remove(id);
    expect(db.a[id]).to.be.undefined;
    expect(db.b[id]).to.be.undefined;
  });

  it('should generate changes', () => {
    const id1 = db.spawn();
    const id2 = db.spawn();
    const id3 = db.spawn();

    const a1 = db.newA(id1);
    const b2 = db.newB(id2);
    const b3 = db.newB(id3);
    expect(db.changes()).to.deep.equal({
      components: {
        a: {[id1]: {x: 0, y: 0}},
        b: {
          [id2]: {foo: ''},
          [id3]: {foo: ''},
        },
      },
    });

    // changes() clears all component changes.
    expect(db.changes()).to.be.null;

    a1.x = 1;
    b2.foo = 'foo';
    b3.foo = 'bar';
    expect(db.changes()).to.deep.equal({
      components: {
        a: {[id1]: {x: 1}},
        b: {
          [id2]: {foo: 'foo'},
          [id3]: {foo: 'bar'},
        },
      },
    });

    expect(db.changes()).to.be.null;

    // Value is the same. No change.
    a1.x = 1;
    expect(db.changes()).to.be.null;
  });

  it('should generate removes', () => {
    const id1 = db.spawn();
    const a1 = db.newA(id1);

    db.remove(id1);
    expect(db.changes()).to.deep.equal({removed: [id1]});

    // Now the removes should be cleared.
    expect(db.changes()).to.be.null;
  });

  it('should generate full snapshot', () => {
    const id1 = db.spawn();
    const id2 = db.spawn();

    const a1 = db.newA(id1);
    const b2 = db.newB(id2);
    expect(db.full()).to.deep.equal({
      full: true,
      components: {
        a: {[id1]: {x: 0, y: 0}},
        b: {[id2]: {foo: ''}},
      },
    });

    // full() shouldn't clear component changes.
    expect(db.changes()).to.not.be.null;

    // We just cleared. full() should still return the data.
    expect(db.full()).to.deep.equal({
      full: true,
      components: {
        a: {[id1]: {x: 0, y: 0}},
        b: {[id2]: {foo: ''}},
      },
    });

    a1.x = 1;
    b2.foo = 'foo';
    expect(db.full()).to.deep.equal({
      full: true,
      components: {
        a: {[id1]: {x: 1, y: 0}},
        b: {[id2]: {foo: 'foo'}},
      },
    });
  });

  it('should apply updates', () => {
    const id = db.spawn();
    const a = db.newA(id);
    const db2 = new TestDb();

    db2.apply(db.changes());
    expect(db2.a[id].full()).to.deep.equal({x: 0, y: 0});

    a.x = 1;
    db2.apply(db.changes());
    expect(db2.a[id].full()).to.deep.equal({x: 1, y: 0});

    a.y = 2;
    db2.apply(db.changes());
    expect(db2.a[id].full()).to.deep.equal({x: 1, y: 2});
  });

  it('should apply full snapshot', () => {
    const id = db.spawn();
    const a = db.newA(id);

    db.changes();
    a.x = 1;
    db.changes();
    a.y = 2;
    db.changes();

    const db2 = new TestDb();
    db2.apply(db.full());
    expect(db2.a[id].full()).to.deep.equal({x: 1, y: 2});
  });

  it('should apply removes from update', () => {
    const id = db.spawn();
    const a = db.newA(id);
    const db2 = new TestDb();
    db2.apply(db.changes());
    expect(db2.a[id]).to.not.be.undefined;

    db.remove(id);
    db2.apply(db.changes());
    expect(db2.a[id]).to.be.undefined;
  });

  it('should apply removes from full snapshot', () => {
    const id = db.spawn();
    const a = db.newA(id);
    const db2 = new TestDb();
    db2.apply(db.full());
    expect(db2.a[id]).to.not.be.undefined;

    db.remove(id);
    db2.apply(db.full());
    expect(db2.a[id]).to.be.undefined;
  });
});
