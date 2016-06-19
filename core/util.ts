import {Position} from './components';

const hypot = (Math as any).hypot || function(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
};

export function dist(a: Position, b: Position): number {
  return hypot(a.x - b.x, a.y - b.y);
}

// every runs the specified function every duration number of seconds.
export function every<T>(duration: number, fn: () => T): () => T {
  let lastTime = 0;
  const durMilli = duration * 1000;
  return () => {
    const time = +new Date();
    if (time - lastTime > durMilli) {
      lastTime = time;
      return fn();
    }
    return null;
  };
}

// Borrowed from:
// https://stackoverflow.com/questions/17633462/format-a-javascript-number-with-a-metric-prefix-like-1-5k-1m-1g-etc
const ranges = [
  {divider: 1e18, suffix: 'P'},
  {divider: 1e15, suffix: 'E'},
  {divider: 1e12, suffix: 'T'},
  {divider: 1e9, suffix: 'G'},
  {divider: 1e6, suffix: 'M'},
  {divider: 1e3, suffix: 'k'},
];
export function formatNumber(n: number, precision: number = 2) {
  for (let range of ranges) {
    if (n >= range.divider) {
      return (n / range.divider).toFixed(precision) + range.suffix;
    }
  }
  return n.toFixed(precision);
}
