///<reference path="../node_modules/@types/chai/index.d.ts" />
///<reference path="../node_modules/@types/mocha/index.d.ts" />

import {expect} from 'chai';

import {formatNumber, numberToSI} from './util';

describe('formatNumber', () => {
  const testData: {n: number, precision: number, want: string}[] = [
    {n: 0, precision: 1, want: '0.0'},
    {n: 12345, precision: 0, want: '12k'},
    {n: 12345, precision: 1, want: '12.3k'},
    {n: 12345678, precision: 2, want: '12.35M'},
    {n: -12345678, precision: 2, want: '-12.35M'},
  ];

  it('should correctly format', () => {
    for (let td of testData) {
      expect(formatNumber(td.n, td.precision)).to.equal(td.want);
    }
  });
  it('should default precision to 2',
     () => { expect(formatNumber(12345)).to.equal('12.35k'); })
});

describe('numberToSI', () => {
  const testData: {n: number, wantN: number, wantPrefix: string}[] = [
    {n: 0, wantN: 0, wantPrefix: ''},
    {n: 12345, wantN: 12.345, wantPrefix: 'k'},
    {n: 12345678, wantN: 12.345678, wantPrefix: 'M'},
    {n: -12345678, wantN: -12.345678, wantPrefix: 'M'},
  ];

  it('should correctly convert', () => {
    for (let td of testData) {
      const {n, prefix} = numberToSI(td.n);
      expect(n).to.equal(td.wantN);
      expect(prefix).to.equal(td.wantPrefix);
    }
  });
});
