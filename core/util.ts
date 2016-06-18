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
