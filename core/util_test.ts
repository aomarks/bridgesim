///<reference path="../typings/browser.d.ts" />

import {expect} from 'chai';
import {radians} from './util';

describe('radians', () => {
  it('should convert from degrees', () => {
    expect(radians(0)).to.equals(0);
    expect(radians(90)).to.equals(Math.PI / 2);
    expect(radians(180)).to.equals(Math.PI);
    expect(radians(360)).to.equals(Math.PI * 2);
  });
});
