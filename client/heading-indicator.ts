///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import {Db} from '../core/entity/db';
import {degrees} from '../core/math';

import * as color from './colors';
import {CANVAS_FONT} from './const';
import {lerp, snap} from './util';

const OUTER_RING_WIDTH = 10;

@component('bridgesim-heading-indicator')
export class HeadingIndicator extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w: number;
  private h: number;
  private centerX: number;
  private centerY: number;
  private radius: number;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
  }

  attached() {
    // TODO Initial resize needs to be async, not sure why.
    this.async(this.resize.bind(this));
    this.listen(window, 'resize', 'resize');
  }

  detached() { this.unlisten(window, 'resize', 'resize'); }

  public draw(alpha: number): void {
    this.maybeResize();

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const innerRingRadius = this.radius - OUTER_RING_WIDTH;
    this.drawTicks(innerRingRadius, 20, 12);
    this.drawTicks(innerRingRadius, 5, 4);
    this.drawLabels(innerRingRadius - 30, 20);

    const position = this.db.positions[this.shipId];
    if (position) {
      let yaw = position.yaw;
      let prev = this.db.prevPositions[this.shipId];
      if (prev) {
        yaw = lerp(yaw, prev.yaw, alpha);
      }
      this.drawTick(this.radius, yaw, 8, color.AQUA);
    }

    const motion = this.db.motion[this.shipId];
    if (motion) {
      this.drawTick(
          this.radius, degrees(Math.atan2(motion.velocityX, motion.velocityY)),
          8, '#FFF');
    }
  }

  private maybeResize() {
    if (this.w === 0 || this.h === 0) {
      this.resize();
    }
  }

  private resize(): void {
    this.w = this.can.clientWidth;
    this.h = this.can.clientHeight;
    this.centerX = snap(this.w / 2);
    this.centerY = snap(this.h / 2);
    this.radius = Math.min(this.w, this.h) / 2;

    const pixelRatio = window.devicePixelRatio;
    this.can.width = this.w * pixelRatio;
    this.can.height = this.h * pixelRatio;
    this.ctx.scale(pixelRatio, pixelRatio);
  }

  private drawTick(
      radius: number, degree: number, tickLength: number, c: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(degree * Math.PI / 180);
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, -radius + tickLength);
    ctx.stroke();
    ctx.restore();
  }

  private drawTicks(
      radius: number, degreeIncrements: number, tickLength: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color.AQUA;
    ctx.beginPath();
    ctx.translate(this.centerX, this.centerY);
    for (let i = 0; i < 360; i += degreeIncrements) {
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, -radius + tickLength);
      ctx.rotate(degreeIncrements * Math.PI / 180);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawLabels(radius: number, degreeIncrements: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = CANVAS_FONT;
    ctx.fillStyle = color.AQUA;
    ctx.translate(this.centerX, this.centerY);
    const radians = degreeIncrements * Math.PI / 180;
    for (let i = 0; i < 360; i += degreeIncrements) {
      const text = i.toString();
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, -textWidth / 2, -radius);
      ctx.rotate(radians);
    }
    ctx.restore();
  }
}

HeadingIndicator.register();
