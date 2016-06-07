import {SECTOR_METERS} from './const';

export function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randGalaxyCoord(galaxySize: number): number {
  const max = galaxySize * SECTOR_METERS / 2;
  return randInt(-max, max);
}
