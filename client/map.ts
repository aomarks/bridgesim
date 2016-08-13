///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import {Point, PositionInterface} from '../core/components';
import {Db} from '../core/entity/db';
import {SECTOR_METERS, maxCoord} from '../core/galaxy';
import {headingToRadians, hypot, radians} from '../core/math';
import {Pathfinder} from '../core/pathfinding';
import {Quadtree} from '../core/quadtree';
import {WeaponType} from '../core/weapon';

import * as color from './colors';
import {CANVAS_FONT, HP} from './const';
import {lerp, snap} from './util';

export interface MapTap { detail: Point; }

const BLIP_PX = 2;
const MIN_METERS_PER_PX = 10;   // How far in we can zoom.
const MAX_METERS_PER_PX = 200;  // How far out we can zoom.

const WEAPON_COLORS = {
  [WeaponType.Laser]: color.RED,
  [WeaponType.Missile]: color.AQUA,
};

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
  private localAlpha: number;
  private remoteAlpha: number;

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

  lerpScreenPos(id: string, alpha: number = null): PositionInterface {
    if (alpha === null) {
      alpha = id === this.shipId ? this.localAlpha : this.remoteAlpha;
    }
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
    this.localAlpha = localAlpha;
    this.remoteAlpha = remoteAlpha;

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
    this.drawDebris();
    this.drawWeaponRanges();
    this.drawStations();
    this.drawRemoteShips();
    this.drawLasers();
    this.drawMissiles();
    this.drawLocalShip();
    if (this.showBoundingBoxes) {
      this.drawBoundingBoxes();
    }
    if (this.showQuadtree) {
      this.drawQuadtree();
    }
    if (this.showPathfinding) {
      this.drawPathfinding();
    }
    if (this.showMotion) {
      this.drawMotion();
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

  private drawDebris(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#964B00';
    ctx.beginPath();
    for (let id in this.db.debris) {
      const coords = this.lerpScreenPos(id);
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

  private drawWeaponRanges(): void {
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    for (let id in this.db.healths) {
      const health = this.db.healths[id];
      if (health.weapons.length == 0) {
        continue;
      }
      const coords = this.lerpScreenPos(id);
      if (coords == null) {
        continue;
      }
      for (let weapon of health.weapons) {
        ctx.beginPath();
        ctx.strokeStyle = WEAPON_COLORS[weapon.type];
        const radius = weapon.range / this.metersPerPx;
        const rad = -headingToRadians(coords.yaw) + weapon.direction;
        if (weapon.angle >= Math.PI * 2 || weapon.angle <= 0) {
          ctx.moveTo(coords.x + radius, coords.y);
          ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
        } else {
          const start = rad - weapon.angle / 2;
          const end = rad + weapon.angle / 2;
          ctx.moveTo(coords.x, coords.y);
          ctx.arc(coords.x, coords.y, radius, start, end);
          ctx.lineTo(coords.x, coords.y);
        }
        ctx.stroke();
      }
    }
  }

  private drawStations(): void {
    for (let id in this.db.stations) {
      const coords = this.lerpScreenPos(id);
      if (coords == null) {
        continue;
      }

      // Draw shield.
      this.drawShield(id);

      this.drawImage(coords.x, coords.y, this.stationImage, 0, 1 / 2);
      const name = this.db.names[id].name;
      this.drawText(coords.x + 10, coords.y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(coords.x + 10, coords.y + 20, health.hp.toString());
      }
    }
  }

  private drawRemoteShips(): void {
    for (let id in this.db.ships) {
      if (id === this.shipId) {
        continue;
      }
      const coords = this.lerpScreenPos(id);
      if (coords == null) {
        return;
      }

      // Draw shield.
      this.drawShield(id);

      // Assign a color based on AI friendliness.
      let shipColor = color.YELLOW;
      const ai = this.db.ais[id];
      if (ai) {
        if (ai.friendliness > (1 / 3)) {
          shipColor = color.GREEN;
        } else if (ai.friendliness < (-1 / 3)) {
          shipColor = color.RED;
        }
      }

      this.ctx.beginPath();
      this.drawBlip(coords.x, coords.y, shipColor);
      const name = this.db.names[id].name;
      this.drawText(coords.x + 10, coords.y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(coords.x + 10, coords.y + 20, health.hp.toString());
      }
    }
  }

  private drawLasers(): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let id in this.db.lasers) {
      const pos = this.lerpScreenPos(id);
      if (pos == null) {
        continue;
      }
      let rads = radians(pos.yaw - 90);
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(rads) * 20, pos.y + Math.sin(rads) * 20);
    }
    ctx.strokeStyle = WEAPON_COLORS[WeaponType.Laser];
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawMissiles(): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let id in this.db.missiles) {
      const pos = this.lerpScreenPos(id);
      if (pos == null) {
        continue;
      }
      let rads = radians(pos.yaw - 90);
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(rads) * 5, pos.y + Math.sin(rads) * 5);
    }
    ctx.strokeStyle = WEAPON_COLORS[WeaponType.Missile];
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawLocalShip(): void {
    if (this.shipId == null) {
      return;
    }
    const pos = this.lerpScreenPos(this.shipId);
    if (pos == null) {
      return;
    }

    // Draw shield.
    this.drawShield(this.shipId);

    // Draw ship icon.
    this.drawImage(pos.x, pos.y, this.shipImage, pos.yaw, .5);
  }

  private drawBoundingBoxes(): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = color.YELLOW;
    ctx.lineWidth = 1;
    for (let id in this.db.collidables) {
      const pos = this.lerpScreenPos(id);
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

  private drawMotion() {
    const ctx = this.ctx;
    ctx.strokeStyle = color.YELLOW;
    ctx.lineWidth = 1;
    for (let id in this.db.motion) {
      const mot = this.db.motion[id];
      const pos = this.lerpScreenPos(id);
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

  private drawShield(id: string): void {
    const health = this.db.healths[id];
    const collidable = this.db.collidables[id];
    const pos = this.lerpScreenPos(id);
    if (!health || !collidable || !pos || !health.shields) {
      return;
    }
    const radius =
        hypot(collidable.length / 2, collidable.width / 2) / this.metersPerPx;
    this.ctx.strokeStyle = color.BLUE;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }
}
Map.register();
