import {PriorityQueue, Set} from 'typescript-collections';

import {Point} from './components';
import {Db} from './entity/db';
import {maxCoord} from './galaxy';
import {dist} from './math';
import {Quadtree} from './quadtree';

// Based off of https://en.wikipedia.org/wiki/A*_search_algorithm

export class Pathfinder {
  private quadtree: Quadtree<string>;
  private max: number;
  private nodes: string[][][];

  constructor(
      private db: Db, galaxySize: number, private precision: number = 1200) {
    const max = maxCoord(galaxySize);
    this.max = max;

    const arrSize = max * 2 / precision;
    const nodes = Array(arrSize);
    for (let i = 0; i < arrSize; i++) {
      nodes[i] = Array(arrSize);
    }
    const padding = this.precision / 2;
    for (let a in this.db.collidables) {
      const {length, width} = this.db.collidables[a];
      const radius = Math.max(length, width) / 2;
      const {x, y} = this.db.positions[a];
      const topLeft =
          this.xyToArr({x: x - padding - radius, y: y - padding - radius});
      const bottomRight =
          this.xyToArr({x: x + padding + radius, y: y + padding + radius});
      for (let x = Math.max(0, topLeft.x); x <= bottomRight.x && x < arrSize;
           x++) {
        for (let y = Math.max(0, topLeft.y); y <= bottomRight.y && y < arrSize;
             y++) {
          if (!nodes[x][y]) {
            nodes[x][y] = [];
          }
          nodes[x][y].push(a);
        }
      }
    }
    this.nodes = nodes;
  }

  public find(from: Point, to: Point, ignore: string = '', previous: Point[] = [
  ]): Point[] {
    const cachedPath = this.validate(from, to, previous, ignore);
    if (cachedPath) {
      return cachedPath;
    }

    return this.findInternal(from, to, ignore);
  }

  // validate ensures that the provided path doesn't have any obstructions and
  // still satisfies the end point.
  public validate(from: Point, to: Point, path: Point[], ignore: string = ''):
      Point[] {
    if (!path || path.length == 0) {
      return null;
    }

    // Make sure endpoint hasn't moved.
    const end = path[path.length - 1];
    if (end.x != to.x || end.y != to.y) {
      return null
    }

    let minI = 0;
    let minV = 0;
    for (let i = 0; i < path.length; i++) {
      const to = path[i];
      const val = this.heuristic(from, to, ignore);
      // Check if the path is blocked.
      if (val < 0) {
        return null;
      }
      // Check if we've moved along the path.
      if (i == 0 || val < minV) {
        minV = val;
        minI = i;
      }
    }
    return path.slice(minI);
  }

  // xyToArr converts the point into the position in the nodes array.
  private xyToArr(a: Point): Point {
    return {
      x: Math.floor((a.x + this.max) / this.precision),
      y: Math.floor((a.y + this.max) / this.precision),
    };
  }

  private findInternal(startP: Point, endP: Point, ignore: string): Point[] {
    const start = this.node(startP);
    const end = this.node(endP);
    const startID = this.nodeID(start);
    const endID = this.nodeID(end);

    const cameFrom: {[key: string]: string} = {};
    const closedSet = new Set<string>();
    const openSet = new Set<string>();

    const gScore: {[key: string]: number} = {};
    gScore[startID] = 0;
    const fScore: {[key: string]: number} = {};
    fScore[startID] = this.heuristic(start, end, ignore);

    const openQueue = new PriorityQueue<Point>((a: Point, b: Point) => {
      return fScore[this.nodeID(b)] - fScore[this.nodeID(a)];
    });
    openQueue.enqueue(start);

    while (!openQueue.isEmpty()) {
      const current = openQueue.dequeue();
      const currentID = this.nodeID(current);
      if (currentID === endID) {
        const path = this.reconstructPath(cameFrom, currentID);
        path[0] = this.copyPoint(startP);
        path[path.length - 1] = this.copyPoint(endP);
        return path;
      }
      openSet.remove(currentID);
      closedSet.add(currentID);
      for (let neighbor of this.neighbors(current)) {
        const neighborID = this.nodeID(neighbor);
        if (closedSet.contains(neighborID)) {
          continue;  // Ignore the neighbor which is already
        }

        // The distance from start to a neighbor
        const heuristic = this.heuristic(current, neighbor, ignore);
        if (heuristic < 0) {
          continue;  // No path.
        }
        const tentative_gScore = gScore[currentID] + heuristic;
        // Discover a new node
        // This is not a better path.
        if (openSet.contains(neighborID) &&
            tentative_gScore >= gScore[neighborID]) {
          continue;
        }
        cameFrom[neighborID] = currentID;
        gScore[neighborID] = tentative_gScore;
        fScore[neighborID] =
            gScore[neighborID] + this.heuristic(neighbor, end, ignore);
        if (!openSet.contains(neighborID)) {
          openSet.add(neighborID);
          openQueue.enqueue(neighbor);
        }
      }
    }

    return [];
  }

  private copyPoint(point: Point) { return {x: point.x, y: point.y}; }

  private reconstructPath(cameFrom: {[key: string]: string}, currentID: string):
      Point[] {
    const path: Point[] = [];
    while (currentID) {
      const {x, y} = JSON.parse(currentID);
      path.push({x: x + this.precision / 2, y: y + this.precision / 2});
      currentID = cameFrom[currentID];
    }
    return path.reverse();
  }

  private neighbors(p: Point): Point[] {
    return [
      this.node(p, 1, 0),
      this.node(p, 0, 1),
      this.node(p, -1, 0),
      this.node(p, 0, -1),
      this.node(p, 1, 1),
      this.node(p, -1, -1),
      this.node(p, -1, 1),
      this.node(p, 1, -1),
    ].filter((a: Point): boolean => {
      // Don't navigate off the edge of the map. This limits the search space
      // and stops infinite loops.
      return a.x < this.max && a.x > -this.max && a.y < this.max &&
          a.y > -this.max;
    });
  }

  private node(p: Point, dx: number = 0, dy: number = 0): Point {
    return {
      x: (Math.floor(p.x / this.precision) + dx) * this.precision,
          y: (Math.floor(p.y / this.precision) + dy) * this.precision,
    }
  }

  private nodeID(p: Point): string { return JSON.stringify(this.node(p)); }

  private heuristic(from: Point, to: Point, ignore: string): number {
    const padding = 0.5 * this.precision;
    let score = dist(from, to);

    const {x, y} = this.xyToArr(to);
    const objects = this.nodes[x][y];

    if (objects) {
      let containsIgnore = false;
      for (let obj of objects) {
        if (obj === ignore) {
          containsIgnore = true;
          break;
        }
      }
      if (!containsIgnore && objects.length > 0) {
        return -1;
      }
    }

    return score;
  }
}
