import {overlap} from './math';

// Based off of
// http://gamedevelopment.tutsplus.com/tutorials/quick-tip-use-quadtrees-to-detect-likely-collisions-in-2d-space--gamedev-374

interface Position {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface RetrievePos<T> {
  children: T[];
  pos: Position[];
}

export class Quadtree<T> {
  public subtrees: Quadtree<T>[] = [];
  private children: T[] = [];
  private childrenPos: Position[] = [];

  public width: number;
  public height: number;

  constructor(
      public left: number, public top: number, public right: number,
      public bottom: number, private max: number = 5) {
    this.width = Math.abs(this.right - this.left);
    this.height = Math.abs(this.bottom - this.top);
  }

  public add(child: T) {}

  public clear() {
    this.children = [];
    this.subtrees = [];
  }

  public insert(
      child: T, left: number, top: number, right: number, bottom: number) {
    if (right < left || top > bottom) {
      throw "invariant violated!";
    }
    // Over split size, split.
    if (this.subtrees.length === 0 && (this.children.length + 1) > this.max) {
      this.split();
      const children = this.children;
      const childrenPos = this.childrenPos;
      this.children = [];
      this.childrenPos = [];
      for (let i = 0; i < children.length; i++) {
        const pos = childrenPos[i];
        this.insert(children[i], pos.left, pos.top, pos.right, pos.bottom);
      }
    }

    const index = this.index(left, top, right, bottom);
    if (index < 0 || this.subtrees.length === 0) {
      this.children.push(child);
      this.childrenPos.push({left, top, right, bottom});
    } else {
      this.subtrees[index].insert(child, left, top, right, bottom);
    }
  }

  // retrieve returns all items that are potentially in provided area. If exact
  // is true, only overlapping objects will be returned.
  public retrieve(
      left: number, top: number, right: number, bottom: number,
      exact: boolean = false): T[] {
    if (right < left || top > bottom) {
      throw "invariant violated!";
    }
    const retPos = this.retrievePos(left, top, right, bottom, exact);
    if (exact) {
      return retPos.children.filter((child: T, i: number): boolean => {
        const pos = retPos.pos[i];
        return overlap(
            {
              x: pos.left,
              y: pos.top,
              width: pos.right - pos.left,
              height: pos.bottom - pos.top
            },
            {x: left, y: top, width: right - left, height: bottom - top});
      });
    }
    return retPos.children;
  }

  private retrievePos(
      left: number, top: number, right: number, bottom: number,
      returnPos: boolean): RetrievePos<T> {
    let children = [];
    let pos = [];
    let todo: Quadtree<T>[] = [this];
    let next: Quadtree<T>;
    while (todo.length > 0) {
      next = todo.pop();
      if (next.subtrees.length !== 0) {
        const index = next.index(left, top, right, bottom);
        if (index >= 0) {
          const tree = next.subtrees[index];
          todo.push(tree);
        } else if (index === -1) {
          todo = todo.concat(next.subtrees);
        }
      }
      children = children.concat(next.children);
      if (returnPos) {
        pos = pos.concat(next.childrenPos);
      }
    }
    return {children, pos};
  }

  private split() {
    if (this.subtrees.length !== 0) {
      throw 'quadtree already has been split';
    }

    const centerX = (this.left + this.right) / 2;
    const centerY = (this.top + this.bottom) / 2;
    this.subtrees[0] =
        new Quadtree<T>(centerX, this.top, this.right, centerY, this.max);
    this.subtrees[1] =
        new Quadtree<T>(this.left, this.top, centerX, centerY, this.max);
    this.subtrees[2] =
        new Quadtree<T>(this.left, centerY, centerX, this.bottom, this.max);
    this.subtrees[3] =
        new Quadtree<T>(centerX, centerY, this.right, this.bottom, this.max);
  }

  private index(left: number, top: number, right: number, bottom: number):
      number {
    // If out of bounds, return -2;
    if (right < this.left || bottom < this.top || left > this.right ||
        top > this.bottom) {
      return -2;
    }

    const centerX = (this.left + this.right) / 2;
    const centerY = (this.top + this.bottom) / 2;
    if (right < centerX) {     // left half
      if (bottom < centerY) {  // top half
        return 1;
      } else if (top > centerY) {  // bottom half
        return 2;
      }
    } else if (left > centerX) {  // right half
      if (bottom < centerY) {     // top half
        return 0;
      } else if (top > centerY) {  // bottom half
        return 3;
      }
    }
    return -1;
  }
}
