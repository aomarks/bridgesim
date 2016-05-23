///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import * as color from './colors';
import {Db} from '../core/entity/db';
import {lerp, snap} from './util';

interface Coord2D {
  x: number;
  y: number;
}

@component('bridgesim-map2')
export class Map2 extends polymer.Base {
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
    this.drawShip(localAlpha);
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

  drawShip(alpha: number): void {
    if (this.shipId == null) {
      return;
    }
    const pos = this.db.positions[this.shipId];
    let prev = this.db.prevPositions[this.shipId];
    if (!prev) {
      prev = pos;
    }
    const coords = this.worldToScreen(
        lerp(pos.x, prev.x, alpha), lerp(pos.y, prev.y, alpha));
    const yaw = lerp(pos.yaw, prev.yaw, alpha);
    this.drawImage(coords.x, coords.y, this.shipImage, yaw, 1 / 2);
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

Map2.register();
