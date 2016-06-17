///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as color from "./colors";
import {Db} from "../core/entity/db";
import {HP} from "./const";
import {lerp} from "./util";
import {radians} from "../core/math";

@component('bridgesim-nav')
export class Nav extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
  }

  draw(alpha: number): void {
    const ctx = this.ctx;

    let w = this.can.width;
    let h = this.can.height;
    ctx.clearRect(0, 0, w, h);

    // Draw circle
    ctx.beginPath();
    ctx.arc(w / 2 + HP, w / 2 + HP, w / 2 - 5, 0, 2 * Math.PI);
    ctx.strokeStyle = color.AQUA;
    ctx.stroke();

    this.drawDegreeTicks(w / 2, h / 2, w / 2 - 5, 30, 6);
    this.drawDegreeTicks(w / 2, h / 2, w / 2 - 5, 5, 4);
    this.drawDegreeLabels(w / 2, h / 2, w / 2 - 22, 30);

    // Draw heading
    const pos = this.db.positions[this.shipId];
    if (!pos) {
      return;
    }
    let prev = this.db.prevPositions[this.shipId];
    if (!prev) {
      prev = pos;
    }
    const yaw = lerp(pos.yaw, prev.yaw, alpha);
    let angle = radians(yaw - 90);
    ctx.beginPath();
    ctx.moveTo(w / 2 + HP, w / 2 + HP);
    ctx.lineTo(
        Math.cos(angle) * (w / 2 - 27) + w / 2 + HP,
        Math.sin(angle) * (w / 2 - 27) + w / 2 + HP);
    ctx.strokeStyle = color.RED;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw degree markers centered at (centerX, and centerY) of radius
  // |radius|, at degree increments |degreeIncrements|.
  drawDegreeLabels(
      centerX: number, centerY: number, radius: number,
      degreeIncrements: number) {
    // Translate draw context to centerX, centerY and rotate by
    // |degreeIncrements| for every degree marker.
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.fillStyle = color.AQUA;
    for (let i = 0; i < 360; i += degreeIncrements) {
      const char = i.toString();
      const charWidth = ctx.measureText(char).width;
      ctx.translate(centerX, centerY);
      ctx.fillText(i.toString(), -charWidth / 2, -radius);
      ctx.rotate(degreeIncrements * Math.PI / 180);
      ctx.translate(-centerX, -centerY);  // reset translation
    }
    ctx.restore();
  }

  drawDegreeTicks(
      centerX: number, centerY: number, radius: number,
      degreeIncrements: number, tickLength: number) {
    // Translate draw context to centerX, centerY and rotate by
    // |degreeIncrements| for every degree marker.
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color.AQUA;
    ctx.beginPath();
    for (let i = 0; i < 360; i += degreeIncrements) {
      ctx.translate(centerX, centerY);
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, -radius + tickLength);
      ctx.rotate(degreeIncrements * Math.PI / 180);
      ctx.translate(-centerX, -centerY);  // reset translation
    }
    ctx.stroke();
    ctx.restore();
  }
}
Nav.register();
