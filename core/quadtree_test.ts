///<reference path="../node_modules/@types/chai/index.d.ts" />
///<reference path="../node_modules/@types/mocha/index.d.ts" />


import {expect} from 'chai';

import {Quadtree} from './quadtree';

describe('quadtree', () => {
  it('should be able to insert and retrieve the same element', () => {
    let inserted = [];
    const tree = new Quadtree<number>(0, 0, 1, 1);
    for (let i = 0; i < 100; i++) {
      const left = Math.random();
      const right = Math.random() * (1 - left) + left;
      const top = Math.random();
      const bottom = Math.random() * (1 - top) + top;
      tree.insert(i, left, top, right, bottom);
      inserted.push({i, left, top, right, bottom});
    }
    for (let object of inserted) {
      const {i, left, top, right, bottom} = object;
      const objs = tree.retrieve(left, top, right, bottom);
      expect(objs.indexOf(i)).to.not.eq(-1);
    }
  });

  it('should be able to insert and retrieve all elements', () => {
    let inserted = [];
    const tree = new Quadtree<number>(0, 0, 1, 1);
    for (let i = 0; i < 100; i++) {
      const left = Math.random();
      const right = Math.random() * (1 - left) + left;
      const top = Math.random();
      const bottom = Math.random() * (1 - top) + top;
      tree.insert(i, left, top, right, bottom);
      inserted.push(i);
    }
    const objs = tree.retrieve(0, 0, 1, 1);
    inserted.sort();
    objs.sort();
    expect(objs).to.deep.equal(inserted);
  });
});
