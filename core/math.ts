import {Point, Region} from './components';

export function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeDegrees(degrees: number): number {
  while(degrees < 0) {
    degrees += 360;
  }
  while(degrees > 360) {
    degrees -= 360;
  }
  return degrees;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

// Get distance between the center of two aabb's and check if they are close
// enough to be overlapping.
export function overlap(a: Region, b: Region): boolean {
  return (
      Math.abs(a.x - b.x) * 2 <= a.width + b.width &&
      Math.abs(a.y - b.y) * 2 <= a.height + b.height);
}

export const hypot = (Math as any).hypot || function(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
};

export function dist(a: Point, b: Point): number {
  if (!a || !b) {
    return -1;
  }
  return hypot(a.x - b.x, a.y - b.y);
}

// Return the compass heading to point a from point b.
export function heading(a: Point, b: Point): number {
  return (Math.atan2(a.x - b.x, a.y - b.y) * (180 / Math.PI) + 360) % 360;
}

// headingToRadians returns the direction in radians.
export function headingToRadians(heading: number): number {
  return radians(90 - heading);
}
