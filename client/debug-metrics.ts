///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

// Millisecond rolling window over which rates are calculated.
const WINDOW = 1000;

// Millisecond interval between rate updates.
const UPDATE_INTERVAL = 1000 / 2;

@component('debug-metrics')
export class DebugMetrics extends polymer.Base {
  // Average frames drawn per second.
  @property({type: String}) drawRate: string;
  // Average input packets sent to the host per second.
  @property({type: String}) sendRate: string;
  // Average update packets received from the host per second.
  @property({type: String}) recvRate: string;

  private handle: number;
  private drawTimes: number[] = [];
  private sendTimes: number[] = [];
  private recvTimes: number[] = [];

  attached() { this.update(); }
  detached() { this.cancelAsync(this.handle); }

  draw() { this.drawTimes.push(performance.now()); }
  send() { this.sendTimes.push(performance.now()); }
  recv() { this.recvTimes.push(performance.now()); }

  private update(): void {
    this.handle = this.async(this.update, UPDATE_INTERVAL);
    const now = performance.now();
    this.drawRate = this.rate(now, this.drawTimes).toFixed(1);
    this.sendRate = this.rate(now, this.sendTimes).toFixed(1);
    this.recvRate = this.rate(now, this.recvTimes).toFixed(1);
  }

  private rate(now: number, points: number[]): number {
    const cutoff = now - WINDOW;
    while (points.length > 1 && points[0] < cutoff) {
      points.shift();
    }
    let sum = 0;
    for (let i = 1; i < points.length; i++) {
      sum += points[i] - points[i - 1];
    }
    if (sum === 0) {
      return 0;
    }
    return 1000 / (sum / (points.length - 1));
  }
}
DebugMetrics.register();
