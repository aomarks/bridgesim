///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import * as color from './colors';
import {snap} from './util';

@component('bridgesim-heading-indicator')
export class HeadingIndicator extends polymer.Base {
  @property({type: String}) shipId: string;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drawn: boolean = false;
  private w: number;
  private h: number;
  private centerX: number;
  private centerY: number;
  private radius: number;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize(): void {
    this.w = this.can.clientWidth;
    this.h = this.can.clientHeight;
    this.centerX = snap(this.w / 2);
    this.centerY = snap(this.h / 2);
    this.radius = Math.min(this.w, this.h) / 2;

    const pixelRatio = window.devicePixelRatio;
    this.can.width = this.w * pixelRatio;
    this.can.height = this.h * pixelRatio;
    this.ctx.scale(pixelRatio, pixelRatio);

    this.drawn = false;
  }

  draw(alpha: number): void {
    if (this.drawn) {
      return;
    }
    this.resize();
    this.drawn = true;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    this.drawTicks(this.radius, 20, 12);
    this.drawTicks(this.radius, 5, 4);
    this.drawLabels(this.radius - 30, 20);
  }

  drawTicks(radius: number, degreeIncrements: number, tickLength: number) {
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

  drawLabels(radius: number, degreeIncrements: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '12px Share Tech Mono';
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
