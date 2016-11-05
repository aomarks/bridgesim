///<reference path="../node_modules/@types/chai/index.d.ts" />
///<reference path="../node_modules/@types/mocha/index.d.ts" />

import {expect} from 'chai';

import {clamp, degrees, radians, overlap} from './math';
import {Region} from './components';

describe('radians', () => {
  it('should convert from degrees', () => {
    expect(radians(0)).to.equals(0);
    expect(radians(90)).to.equals(Math.PI / 2);
    expect(radians(180)).to.equals(Math.PI);
    expect(radians(360)).to.equals(Math.PI * 2);
  });
});

describe('degrees', () => {
  it('should convert from radians', () => {
    expect(degrees(0)).to.equals(0);
    expect(degrees(Math.PI / 2)).to.equals(90);
    expect(degrees(Math.PI)).to.equals(180);
    expect(degrees(Math.PI * 2)).to.equals(360);
  });
});

describe('clamp', () => {
  it('should clamp value to range', () => {
    expect(clamp(0, 0, 0)).to.equals(0);
    expect(clamp(0, 0, 1)).to.equals(0);
    expect(clamp(1, 0, 1)).to.equals(1);
    expect(clamp(-0.1, 0, 1)).to.equals(0);
    expect(clamp(1.1, 0, 1)).to.equals(1);
  });
});

describe('overlap', () => {
  const testData: {a: Region; b: Region; overlap: boolean;}[] = [
    {
      a: {x: 0, y: 0, width: 0.5, height: 0.5},
      b: {x: 0, y: 0, width: 1, height: 1},
      overlap: true
    },
    {
      a: {x: 0, y: 0, width: 1, height: 1},
      b: {x: 1, y: 1, width: 1, height: 1},
      overlap: true
    },
    {
      a: {x: 0, y: 0, width: 1, height: 1},
      b: {x: -1, y: -1, width: 1, height: 1},
      overlap: true
    },
    {
      a: {x: 0, y: 0, width: 1, height: 1},
      b: {x: 2, y: 2, width: 1, height: 1},
      overlap: false
    },
  ];

  it('should compute overlaps', () => {
    for (let td of testData) {
      expect(overlap(td.a, td.b)).to.equal(td.overlap);
      expect(overlap(td.b, td.a)).to.equal(td.overlap);
    }
  });

  it('should compute overlaps with self', () => {
    for (let td of testData) {
      expect(overlap(td.a, td.a)).to.be.true;
      expect(overlap(td.b, td.b)).to.be.true;
    }
  });
});
