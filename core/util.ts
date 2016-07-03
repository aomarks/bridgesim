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

interface SINumber {
  n: number;
  prefix: string;
}

export function numberToSI(n: number): SINumber {
  const sign = (n >= 0) ? 1 : -1;
  if (n < 0) {
    n *= -1;
  }
  for (let range of ranges) {
    if (n >= range.divider) {
      return {n: sign * (n / range.divider), prefix: range.suffix};
    }
  }
  return {n: sign * n, prefix: ''};
}

export function formatNumber(num: number, precision: number = 2): string {
  const {n, prefix} = numberToSI(num);
  return n.toFixed(precision) + prefix;
}
