///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {numberToSI} from '../core/util';

// Millisecond interval between metric calculations.
const UPDATE_INTERVAL = 1000 / 3;

// Millisecond rolling window for FPS metric.
const DRAW_WINDOW = 2 * 1000;

// Millisecond rolling window for received kB/sec metric.
const RECV_WINDOW = 3 * 1000;

interface point {
  ts: number;
  val: number;
}

@component('debug-metrics')
export class DebugMetrics extends polymer.Base {
  // Average frame rate over the past second.
  @property({type: String}) drawRate: string;
  // Total <recvRatePrefix>bytes transferred in the past second.
  @property({type: String}) recvRate: string;
  // The SI prefix for the recvRate.
  @property({type: String}) recvRatePrefix: string;

  private handle: number;
  private drawPoints: point[] = [];
  private recvPoints: point[] = [];

  attached() { this.update(); }
  detached() { this.cancelAsync(this.handle); }

  draw(ts: number, elapsed: number){
      this.drawPoints.push({ts: ts, val: 1000 / elapsed})};

  recv(bytes: number) {
    this.recvPoints.push({ts: performance.now(), val: bytes});
  }

  private update(): void {
    this.handle = this.async(this.update, UPDATE_INTERVAL);
    const now = performance.now();

    this.prune(this.drawPoints, now - DRAW_WINDOW);
    this.drawRate = this.avg(this.drawPoints).toFixed(1);

    this.prune(this.recvPoints, now - RECV_WINDOW);
    let recvRate = 0;
    if (this.recvPoints.length) {
      recvRate =
          this.sum(this.recvPoints) / this.timespan(this.recvPoints) * 1000;
    }
    const {n, prefix} = numberToSI(recvRate);
    this.recvRate = n.toFixed(1);
    this.recvRatePrefix = prefix;
  }

  private prune(points: point[], minTime: number) {
    while (points.length && points[0].ts < minTime) {
      points.shift();
    }
  }

  private avg(points: point[]): number {
    if (points.length === 0) {
      return 0;
    }
    return this.sum(points) / points.length;
  }

  private sum(points: point[]): number {
    let sum = 0;
    for (let point of points) {
      sum += point.val;
    }
    return sum;
  }

  private timespan(points: point[]): number {
    if (!points.length) {
      return 0;
    }
    return points[points.length - 1].ts - points[0].ts;
  }
}
DebugMetrics.register();
