import {Point, Region} from './components.ts';

export function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function overlap(a: Region, b: Region): boolean {
  // Get distance between the center of two aabb's and check if they are
  // close enough
  // to be overlapping.
  return (
      Math.abs(a.x - b.x) * 2 <= a.width + b.width &&
      Math.abs(a.y - b.y) * 2 <= a.height + b.height);
}

const hypot = (Math as any).hypot || function(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
};

export function dist(a: Point, b: Point): number {
  if (!a || !b) {
    return -1;
  }
  return hypot(a.x - b.x, a.y - b.y);
}

// This returns the compass heading to point a from point b.
export function heading(a: Point, b: Point): number {
  return (Math.atan2(a.x - b.x, a.y - b.y) * (180 / Math.PI) + 360) % 360;
}
