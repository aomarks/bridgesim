import {randInt} from './math';
import {Point} from './components';

export const SECTOR_METERS = 10000;

// Returns the absolute value of the maximum coordinate on either axis.
export function maxCoord(galaxySize: number): number {
  return galaxySize * SECTOR_METERS / 2;
}

// Return a random coordinate on one axis.
export function randCoord(galaxySize: number): number {
  const max = maxCoord(galaxySize);
  return randInt(-max, max);
}

export function randPoint(galaxySize: number): Point {
  return {x: randCoord(galaxySize), y: randCoord(galaxySize)};
}
