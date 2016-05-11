///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import * as color from "./colors";
import {Db} from "../core/entity/db";
import {HP} from "./const";
import {radians} from "../core/util";
import {lerp} from "./util";

const TILE_PX = 50;
const BLIP_PX = 2;

@component('bridgesim-map')
export class Map extends polymer.Base {
  @property({type: Number}) size: number;
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;

  private can: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shipImage: HTMLImageElement;
  private stationImage: HTMLImageElement;

  ready(): void {
    this.can = this.$.canvas;
    this.ctx = this.can.getContext('2d');
    this.ctx.font = '11px Share Tech Mono, monospace';
    this.shipImage = new Image();
    this.shipImage.src = "/images/ship.svg";
    this.stationImage = new Image();
    this.stationImage.src = "/images/station.svg";
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

  draw(localAlpha: number, remoteAlpha: number): void {
    let ctx = this.ctx;

    ctx.clearRect(0, 0, this.can.width, this.can.height);

    ctx.beginPath();
    for (let i = 0; i < this.size + 1; i++) {
      ctx.moveTo(i * TILE_PX + HP, HP);
      ctx.lineTo(i * TILE_PX + HP, this.size * TILE_PX + HP);
      ctx.moveTo(HP, i * TILE_PX + HP);
      ctx.lineTo(this.size * TILE_PX + HP, i * TILE_PX + HP);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = color.GREEN;
    ctx.stroke();

    for (let shipId in this.db.ships) {
      const alpha = shipId === this.shipId ? localAlpha : remoteAlpha;
      const pos = this.db.positions[shipId];
      if (!pos) {
        continue;
      }
      let prev = this.db.prevPositions[shipId];
      if (!prev) {
        prev = pos;
      }
      ctx.beginPath();
      let x = lerp(pos.x, prev.x, alpha) * TILE_PX + TILE_PX / 2 + HP;
      let y = lerp(pos.y, prev.y, alpha) * TILE_PX + TILE_PX / 2 + HP;
      if (shipId === this.shipId) {
        const yaw = lerp(pos.yaw, prev.yaw, alpha);
        this.drawImage(x, y, this.shipImage, yaw, 1 / 2);
      } else {
        this.drawBlip(x, y, '#FF0000');
      }

      const name = this.db.names[shipId];
      this.drawText(x + 10, y + 5, name);

      const health = this.db.healths[shipId];
      if (health != null) {
        this.drawText(x + 10, y + 20, health.hp.toString());
      }
    }

    for (let id in this.db.stations) {
      const pos = this.db.positions[id];
      let prev = this.db.prevPositions[id];
      if (!prev) {
        prev = pos;
      }
      let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      this.drawImage(x, y, this.stationImage, 0, 1 / 2);
      const name = this.db.names[id];
      this.drawText(x + 10, y + 5, name);
      const health = this.db.healths[id];
      if (health != null) {
        this.drawText(x + 10, y + 20, health.hp.toString());
      }
    }

    for (let id in this.db.debris) {
      const pos = this.db.positions[id];
      let prev = this.db.prevPositions[id];
      if (!prev) {
        prev = pos;
      }
      let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      this.drawBlip(x, y, '#964B00');
    }

    for (let id in this.db.lasers) {
      const pos = this.db.positions[id];
      let prev = this.db.prevPositions[id];
      if (!prev) {
        prev = pos;
      }
      let rads = radians(lerp(pos.yaw, prev.yaw, remoteAlpha) - 90);
      ctx.beginPath();
      let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(rads) * 20, y + Math.sin(rads) * 20);
      ctx.strokeStyle = '#F00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let id in this.db.missiles) {
      const pos = this.db.positions[id];
      let prev = this.db.prevPositions[id];
      if (!prev) {
        prev = pos;
      }
      let rads = radians(lerp(pos.yaw, prev.yaw, remoteAlpha) - 90);
      ctx.beginPath();
      let x = lerp(pos.x, prev.x, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      let y = lerp(pos.y, prev.y, remoteAlpha) * TILE_PX + TILE_PX / 2 + HP;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(rads) * 5, y + Math.sin(rads) * 5);
      ctx.strokeStyle = color.AQUA;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
Map.register();
