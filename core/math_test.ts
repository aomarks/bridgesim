///<reference path="../typings/index.d.ts" />

import {expect} from 'chai';
import {radians, clamp} from './math';

describe('radians', () => {
  it('should convert from degrees', () => {
    expect(radians(0)).to.equals(0);
    expect(radians(90)).to.equals(Math.PI / 2);
    expect(radians(180)).to.equals(Math.PI);
    expect(radians(360)).to.equals(Math.PI * 2);
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
