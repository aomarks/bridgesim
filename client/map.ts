///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import {PositionInterface, Point} from '../core/components';
import {Db} from '../core/entity/db';
import {SECTOR_METERS, maxCoord} from '../core/galaxy';
import {radians} from '../core/math';
import {Pathfinder} from '../core/pathfinding';
import {Quadtree} from '../core/quadtree';

import * as color from './colors';
import {CANVAS_FONT, HP} from './const';
import {lerp, snap} from './util';

export interface MapTap { detail: Point; }

const BLIP_PX = 2;
const MIN_METERS_PER_PX = 10;   // How far in we can zoom.
const MAX_METERS_PER_PX = 200;  // How far out we can zoom.

@component('bridgesim-map')
export class Map extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) follow: string;
  @property({type: Number, value: 2}) size: number;
  @property({type: Number, value: 0}) zoom: number;
  @property({type: Boolean, value: false}) showBoundingBoxes: boolean;
  @property({type: Boolean, value: false}) showQuadtree: boolean;
  @property({type: Boolean, value: false}) showPathfinding: boolean;
  @property({type: Boolean, value: false}) showMotion: boolean;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shipImage: HTMLImageElement;
  private stationImage: HTMLImageElement;
  private w: number;  // canvas width
  private h: number;  // canvas height
  private centerCC: Point = {x: 0, y: 0};
  private followGC: Point = {x: 0, y: 0};
  private drawn: boolean = false;
  private metersPerPx: number;
  private left: number;
  private top: number;
  private quadtree: Quadtree<string>;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
    this.shipImage = new Image();
    this.shipImage.src = 'images/ship.svg';
    this.stationImage = new Image();
    this.stationImage.src = 'images/station.svg';
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize(): void {
    this.w = this.clientWidth;
    this.h = this.clientHeight;
    this.centerCC.x = this.w / 2;
    this.centerCC.y = this.h / 2;

    const bounds = this.can.getBoundingClientRect();
    this.left = bounds.left;
    this.top = bounds.top;

    const pixelRatio = window.devicePixelRatio;
    this.can.width = this.w * pixelRatio;
    this.can.height = this.h * pixelRatio;
    this.ctx.scale(pixelRatio, pixelRatio);
    this.can.style.transform = 'scale(' + (1 / window.devicePixelRatio) + ')';
  }

  @listen('tap')
  handleTap(e: any) {
    this.fire(
        'map-tap',
        this.screenToWorld(e.detail.x - this.left, e.detail.y - this.top));
  }

  worldToScreen(x: number, y: number): Point {
    return {
      x: this.centerCC.x + x / this.metersPerPx -
          this.followGC.x / this.metersPerPx,
      y: this.centerCC.y - y / this.metersPerPx +
          this.followGC.y / this.metersPerPx
    };
  }

  screenToWorld(x: number, y: number): Point {
    return {
      x: this.followGC.x + x * this.metersPerPx -
          this.centerCC.x * this.metersPerPx,
      y: this.followGC.y - y * this.metersPerPx +
          this.centerCC.y * this.metersPerPx,
    };
  }

  lerpScreenPos(id: string, alpha: number): PositionInterface {
    const pos = this.db.positions[id];
    if (pos == null) {
      return null;
    }
    let prev = this.db.prevPositions[id];
    if (prev == null) {
      prev = pos;
    }
    const s = this.worldToScreen(
        lerp(pos.x, prev.x, alpha), lerp(pos.y, prev.y, alpha));
    return {x: s.x, y: s.y, yaw: lerp(pos.yaw, prev.yaw, alpha), roll: 0};
  }

  public draw(localAlpha: number, remoteAlpha: number): void {
    if (!this.drawn) {
      this.resize();  // gross
    }
    this.ctx.clearRect(0, 0, this.w, this.h);

    // Transform zoom range [0,1] to meter/px range.
    this.metersPerPx = (-this.zoom * (MAX_METERS_PER_PX - MIN_METERS_PER_PX)) +
        MAX_METERS_PER_PX;

    const pos = this.db.positions[this.follow];
    if (this.follow == null || !pos) {
      this.followGC.x = this.followGC.y = 0;
    } else {
      let prev = this.db.prevPositions[this.follow];
      if (prev == null) {
        prev = pos;
      }
      this.followGC.x = lerp(pos.x, prev.x, localAlpha);
      this.followGC.y = lerp(pos.y, prev.y, localAlpha);
    }

    this.drawGrid();
    this.drawDebris(remoteAlpha);
    this.drawStations(remoteAlpha);
    this.drawRemoteShips(remoteAlpha);
    this.drawLasers(remoteAlpha);
    this.drawMissiles(remoteAlpha);
    this.drawLocalShip(localAlpha);
    if (this.showBoundingBoxes) {
      this.drawBoundingBoxes(localAlpha, remoteAlpha);
    }
    if (this.showQuadtree) {
      this.drawQuadtree();
    }
    if (this.showPathfinding) {
      this.drawPathfinding();
    }
    if (this.showMotion) {
      this.drawMotion(remoteAlpha);
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const sectorPx = Math.round(SECTOR_METERS / this.metersPerPx);
    const galaxyPx = sectorPx * this.size;
    const topLeft = {
      x: snap(
          this.centerCC.x - galaxyPx / 2 - this.followGC.x / this.metersPerPx),
      y: snap(
          this.centerCC.y - galaxyPx / 2 + this.followGC.y / this.metersPerPx),
    };
    const gridTop = Math.max(0, topLeft.y);
    const gridBottom = Math.min(this.h, galaxyPx + topLeft.y);
    const gridLeft = Math.max(0, topLeft.x);
    const gridRight = Math.min(this.w, galaxyPx + topLeft.x);
    let x = 0;
    let y = 0;
    ctx.strokeStyle = color.GREEN;
    ctx.beginPath();
    for (let i = 0; i <= this.size; i++) {
      x = i * sectorPx + topLeft.x;
      if (x >= 0 && x <= this.w) {
        ctx.moveTo(x, gridTop);
        ctx.lineTo(x, gridBottom);
      }
      y = i * sectorPx + topLeft.y;
      if (y >= 0 && y <= this.h) {
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridRight, y);
      }
    }
    ctx.stroke();
  }

  private drawDebris(alpha: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#964B00';
    ctx.beginPath();
    for (let id in this.db.debris) {
      const coords = this.lerpScreenPos(id, alpha);
      if (coords == null) {
        continue;
      }
      const collidable = this.db.collidables[id];
      if (collidable == null) {
        continue;
      }
      const radius = Math.max(.5, collidable.length / this.metersPerPx / 2);
      if (coords.x + radius < 0 || coords.x - radius > this.w ||
          coords.y + radius < 0 || coords.y - radius > this.h) {
        continue;
      }
      ctx.moveTo(coords.x + radius, coords.y);
      ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
    }
    ctx.stroke();
  }

  private drawStations(alpha: number): void {
    for (let id in this.db.stations) {
      const coords = this.lerpScreenPos(id, alpha);
      if (coords == null) {
        continue;
      }
      this.drawImage(coords.x, coords.y, this.stationImage, 0, 1 / 2);
      const name = this.db.names[id].name;
      this.drawText(coords.x + 10, coords.y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(coords.x + 10, coords.y + 20, health.hp.toString());
      }
    }
  }

  private drawRemoteShips(alpha: number): void {
    for (let id in this.db.ships) {
      if (id === this.shipId) {
        continue;
      }
      const coords = this.lerpScreenPos(id, alpha);
      if (coords == null) {
        return;
      }
      this.ctx.beginPath();
      this.drawBlip(coords.x, coords.y, '#FF0000');
      const name = this.db.names[id].name;
      this.drawText(coords.x + 10, coords.y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(coords.x + 10, coords.y + 20, health.hp.toString());
      }
    }
  }

  private drawLasers(alpha: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let id in this.db.lasers) {
      const pos = this.lerpScreenPos(id, alpha);
      if (pos == null) {
        continue;
      }
      let rads = radians(pos.yaw - 90);
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(rads) * 20, pos.y + Math.sin(rads) * 20);
    }
    ctx.strokeStyle = '#F00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawMissiles(alpha: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let id in this.db.missiles) {
      const pos = this.lerpScreenPos(id, alpha);
      if (pos == null) {
        continue;
      }
      let rads = radians(pos.yaw - 90);
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(rads) * 5, pos.y + Math.sin(rads) * 5);
    }
    ctx.strokeStyle = color.AQUA;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawLocalShip(alpha: number): void {
    if (this.shipId == null) {
      return;
    }
    const pos = this.lerpScreenPos(this.shipId, alpha);
    if (pos == null) {
      return;
    }
    this.drawImage(pos.x, pos.y, this.shipImage, pos.yaw, .5);
  }

  private drawBoundingBoxes(localAlpha: number, remoteAlpha: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = color.YELLOW;
    ctx.lineWidth = 1;
    for (let id in this.db.collidables) {
      const pos =
          this.lerpScreenPos(id, id === this.shipId ? localAlpha : remoteAlpha);
      if (pos == null) {
        continue;
      }
      const collidable = this.db.collidables[id];
      const width = collidable.width / this.metersPerPx;
      const height = collidable.length / this.metersPerPx;
      ctx.rect(
          snap(pos.x - width / 2), snap(pos.y - height / 2), width, height);
    }
    ctx.stroke();
  }

  private drawQuadtree(): void {
    if (!this.quadtree) {
      const max = maxCoord(this.size);
      this.quadtree = new Quadtree<string>(-max, -max, max, max);
    }
    for (let a in this.db.collidables) {
      const {length, width} = this.db.collidables[a];
      const {x, y} = this.db.positions[a];
      this.quadtree.insert(a, x, y, x + length, y + width);
    }

    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = color.YELLOW;
    ctx.lineWidth = 1;
    let todo: Quadtree<string>[] = [this.quadtree];
    while (todo.length > 0) {
      const tree = todo.pop();
      todo = todo.concat(tree.subtrees);
      const {x: left, y: top} = this.worldToScreen(tree.left, tree.top);
      const {x: right, y: bottom} = this.worldToScreen(tree.right, tree.bottom);
      ctx.rect(
          snap(left), snap(top), Math.round(right - left),
          Math.round(bottom - top));
    }
    ctx.stroke();
    this.quadtree.clear();
  }

  private drawPathfinding() {
    const finder = new Pathfinder(this.db, this.size);

    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = color.YELLOW;
    ctx.lineWidth = 1;

    for (let id in this.db.ais) {
      const start = this.db.positions[id];
      if (!start) {
        return;
      }
      const end = this.db.ais[id].targetPos;
      const path = finder.find(start, end, this.shipId);
      const coords = this.worldToScreen(start.x, start.y);
      ctx.moveTo(coords.x, coords.y);
      for (let p of path) {
        const {x, y} = this.worldToScreen(p.x, p.y);
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  private drawMotion(alpha: number) {
    const ctx = this.ctx;
    ctx.strokeStyle = color.YELLOW;
    ctx.lineWidth = 1;
    for (let id in this.db.motion) {
      const mot = this.db.motion[id];
      const pos = this.lerpScreenPos(id, alpha);
      if (!pos || !mot) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + mot.velocityX / 2, pos.y - mot.velocityY / 2);
      ctx.stroke();
    }
  }

  private drawText(x: number, y: number, text: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.font = CANVAS_FONT;
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  private drawBlip(x: number, y: number, color: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawImage(
      x: number, y: number, image: HTMLImageElement, yaw: number,
      scale: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(yaw * Math.PI / 180);
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
}
Map.register();
