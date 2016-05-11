///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as color from "./colors";
import {Db} from "../core/entity/db";
import {HP} from "./const";
import {snap} from "./util";

const PAD = 5;
const PAD2 = PAD * 2;
const BAR_W = 40;

@component('bridgesim-power')
export class Power extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String}) curSubsystem: string;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
  }

  draw(): void {
    const ctx = this.ctx;
    const w = this.can.width - 1;
    const h = this.can.height - 1;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#AAA';
    ctx.strokeRect(HP, HP, w, h);

    ctx.fillStyle = '#00F';
    const power = this.db.power[this.shipId];
    if (!power) {
      return;
    }
    const names = Object.keys(power);
    names.sort();
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const level = power[name];
      ctx.fillRect(
          (i * BAR_W) + PAD + HP, h - PAD + HP, BAR_W - PAD,
          snap(-((level / 100) * (h - PAD2))));

      this.drawLabel(name.toUpperCase(), h / 2, (i + 0.5) * BAR_W + PAD);
    }

    const cur = names.indexOf(this.curSubsystem);
    if (cur != -1) {
      ctx.strokeStyle = '#F00';
      ctx.strokeRect((cur * BAR_W) + PAD + HP, PAD + HP, BAR_W - PAD, h - PAD2);
    }
  }

  // Draw |text| centered at (|centerX|, |centerY|)
  drawLabel(text: string, centerY: number, centerX: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color.WHITE;
    ctx.rotate(-90 * Math.PI / 180);
    const labelWidth = ctx.measureText(text).width;
    ctx.fillText(text, -centerY - (labelWidth / 2), centerX);
    ctx.restore();
  }
}
Power.register();
