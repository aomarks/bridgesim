import {Db} from './entity/db';
import {Quadtree} from './quadtree';
import {maxCoord} from './galaxy';
import {dist} from './math';
import {Point} from './components';
import {Set, PriorityQueue} from 'typescript-collections';

// Based off of https://en.wikipedia.org/wiki/A*_search_algorithm

export class Pathfinder {
  private quadtree: Quadtree<string>;
  private max: number;

  constructor(
      private db: Db, galaxySize: number, private precision: number = 1200) {
    const max = maxCoord(galaxySize);
    this.max = max;
    this.quadtree = new Quadtree<string>(-max, -max, max, max);
  }

  public find(startP: Point, endP: Point, ignore: string = ''): Point[] {
    this.quadtree.clear();

    for (let a in this.db.collidables) {
      if (ignore === a) {
        continue;
      }
      const {length, width} = this.db.collidables[a];
      const {x, y} = this.db.positions[a];
      this.quadtree.insert(a, x, y, x + length, y + width);
    }

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
    fScore[startID] = this.heuristic(start, end);

    const openQueue = new PriorityQueue<Point>((a: Point, b: Point) => {
      return fScore[this.nodeID(b)] - fScore[this.nodeID(a)];
    });
    openQueue.enqueue(start);

    while (!openQueue.isEmpty()) {
      const current = openQueue.dequeue();
      const currentID = this.nodeID(current);
      if (currentID === endID) {
        const path = this.reconstructPath(cameFrom, currentID);
        path[0] = startP;
        path[path.length - 1] = endP;
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
        const tentative_gScore =
            gScore[currentID] + this.heuristic(current, neighbor);
        // Discover a new node
        // This is not a better path.
        if (openSet.contains(neighborID) &&
            tentative_gScore >= gScore[neighborID]) {
          continue;
        }
        cameFrom[neighborID] = currentID;
        gScore[neighborID] = tentative_gScore;
        fScore[neighborID] = gScore[neighborID] + this.heuristic(neighbor, end);
        if (!openSet.contains(neighborID)) {
          openSet.add(neighborID);
          openQueue.enqueue(neighbor);
        }
      }
    }

    return [];
  }

  private reconstructPath(cameFrom: {[key: string]: string}, currentID: string):
      Point[] {
    const path: Point[] = [];
    while (currentID) {
      const {x, y} = JSON.parse(currentID)
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
          y: (Math.floor(p.y / this.precision) + dy) * this.precision
    }
  }

  private nodeID(p: Point): string { return JSON.stringify(this.node(p)); }

  private heuristic(from: Point, to: Point): number {
    const {x, y} = this.node(to);
    const objects = this.quadtree.retrieve(
        x, y, x + this.precision, y + this.precision, true);
    let score = dist(from, to);
    if (objects.length > 0) {
      score += 1000000000;
    }
    return score;
  }
}
