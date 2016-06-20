import {randInt} from './math';

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
