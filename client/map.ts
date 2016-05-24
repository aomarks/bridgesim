///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import * as color from './colors';
import {Db} from '../core/entity/db';
import {HP} from './const';
import {lerp, snap} from './util';
import {radians} from '../core/util';
import {Position} from '../core/components';

interface Coord2D {
  x: number;
  y: number;
}

const BLIP_PX = 2;

@component('bridgesim-map')
export class Map extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) follow: string;
  @property({type: Number, value: 10}) size: number;
  @property({type: Number, value: 150}) zoom: number;
  @property({type: Number, value: 0}) panX: number;
  @property({type: Number, value: 0}) panY: number;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shipImage: HTMLImageElement;
  private stationImage: HTMLImageElement;
  private w: number;  // canvas width
  private h: number;  // canvas height
  private screenCenter: Coord2D = {x: 0, y: 0};
  private worldCenter: Coord2D = {x: 0, y: 0};
  private drawn: boolean = false;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
    this.shipImage = new Image();
    this.shipImage.src = '/images/ship.svg';
    this.stationImage = new Image();
    this.stationImage.src = '/images/station.svg';
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize(): void {
    this.w = this.can.width = this.can.clientWidth;
    this.h = this.can.height = this.can.clientHeight;
    this.screenCenter.x = this.w / 2;
    this.screenCenter.y = this.h / 2;
  }

  worldToScreen(x: number, y: number): Coord2D {
    return {
      x: this.screenCenter.x - (this.worldCenter.x * this.zoom) +
          (x * this.zoom) + this.panX,
      y: this.screenCenter.y - (this.worldCenter.y * this.zoom) +
          (y * this.zoom) - this.panY
    };
  }

  lerpScreenPos(id: string, alpha: number): Position {
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


  draw(localAlpha: number, remoteAlpha: number): void {
    if (!this.drawn) {
      this.resize();  // gross
    }

    this.ctx.clearRect(0, 0, this.w, this.h);

    if (this.follow == null) {
      this.worldCenter.x = this.worldCenter.y = this.size / 2;

    } else {
      const pos = this.db.positions[this.follow];
      let prev = this.db.prevPositions[this.follow];
      if (prev == null) {
        prev = pos;
      }
      this.worldCenter.x = lerp(pos.x, prev.x, localAlpha);
      this.worldCenter.y = lerp(pos.y, prev.y, localAlpha);
    }

    this.drawGrid();
    this.drawDebris(remoteAlpha);
    this.drawStations(remoteAlpha);
    this.drawRemoteShips(remoteAlpha);
    this.drawLasers(remoteAlpha);
    this.drawMissiles(remoteAlpha);
    this.drawLocalShip(localAlpha);
  }

  drawGrid(): void {
    const ctx = this.ctx;
    const sectPx = this.zoom;
    const topLeft = this.worldToScreen(0, 0);
    ctx.beginPath();
    for (let i = 0; i <= this.size; i++) {
      ctx.moveTo(i * sectPx + topLeft.x, topLeft.y);
      ctx.lineTo(i * sectPx + topLeft.x, this.size * sectPx + topLeft.y);
      ctx.moveTo(topLeft.x, i * sectPx + topLeft.y);
      ctx.lineTo(this.size * sectPx + topLeft.x, i * sectPx + topLeft.y);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = color.GREEN;
    ctx.stroke();
  }

  drawDebris(alpha: number): void {
    for (let id in this.db.debris) {
      const coords = this.lerpScreenPos(id, alpha);
      if (coords == null) {
        continue;
      }
      this.drawBlip(coords.x, coords.y, '#964B00');
    }
  }

  drawStations(alpha: number): void {
    for (let id in this.db.stations) {
      const coords = this.lerpScreenPos(id, alpha);
      if (coords == null) {
        continue;
      }
      this.drawImage(coords.x, coords.y, this.stationImage, 0, 1 / 2);
      const name = this.db.names[id];
      this.drawText(coords.x + 10, coords.y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(coords.x + 10, coords.y + 20, health.hp.toString());
      }
    }
  }

  drawRemoteShips(alpha: number): void {
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
      const name = this.db.names[id];
      this.drawText(coords.x + 10, coords.y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(coords.x + 10, coords.y + 20, health.hp.toString());
      }
    }
  }

  drawLasers(alpha: number): void {
    const ctx = this.ctx;
    for (let id in this.db.lasers) {
      const pos = this.lerpScreenPos(id, alpha);
      if (pos == null) {
        continue;
      }
      let rads = radians(pos.yaw - 90);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(rads) * 20, pos.y + Math.sin(rads) * 20);
      ctx.strokeStyle = '#F00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawMissiles(alpha: number): void {
    const ctx = this.ctx;
    for (let id in this.db.missiles) {
      const pos = this.lerpScreenPos(id, alpha);
      if (pos == null) {
        continue;
      }
      let rads = radians(pos.yaw - 90);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(rads) * 5, pos.y + Math.sin(rads) * 5);
      ctx.strokeStyle = color.AQUA;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawLocalShip(alpha: number): void {
    if (this.shipId == null) {
      return;
    }
    const pos = this.lerpScreenPos(this.shipId, alpha);
    if (pos == null) {
      return;
    }
    this.drawImage(pos.x, pos.y, this.shipImage, pos.yaw, .5);
  }

  drawText(x: number, y: number, text: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  drawBlip(x: number, y: number, color: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, BLIP_PX, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawImage(
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
