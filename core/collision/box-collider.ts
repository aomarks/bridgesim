import {overlap} from '../math';

// Axis-aligned bounding box with mass
export class BoxCollider {
  x: number;
  y: number;
  width: number;
  height: number;
  mass: number;

  constructor(
      x: number, y: number, width: number, height: number, mass: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.mass = mass;
  }

  isOverlap(other: BoxCollider): boolean { return overlap(this, other); }

  resolveCollision(other: BoxCollider) {
    // Simplistic non-realistic resolution of a collision
    const REBOUND = 1.5;
    let percentAbsorb = this.mass / (this.mass + other.mass);
    let xOverlap =
        0.5 * (this.width + other.width) - Math.abs(other.x - this.x);
    let yOverlap =
        0.5 * (this.height + other.height) - Math.abs(other.y - this.y);
    if (this.x > other.x) {
      this.x += REBOUND * percentAbsorb * xOverlap;
      other.x -= REBOUND * percentAbsorb * xOverlap;
    } else {
      this.x -= REBOUND * percentAbsorb * xOverlap;
      other.x += REBOUND * percentAbsorb * xOverlap;
    }

    if (this.y > other.y) {
      this.y += REBOUND * percentAbsorb * yOverlap;
      other.y -= REBOUND * percentAbsorb * yOverlap;
    } else {
      this.y -= REBOUND * percentAbsorb * yOverlap;
      other.y += REBOUND * percentAbsorb * yOverlap;
    }
  }
}
