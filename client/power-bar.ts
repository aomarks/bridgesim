///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

@component('bridgesim-power-bar')
export class PowerBar extends polymer.Base {
  @property({type: String, value: '?'}) name: string;
  @property({type: Number, value: 0}) level: number;
  @property({type: Boolean, value: false}) active: boolean;

  private trackStartLevel: number = 0;

  private downBar(e: any) {
    const rect = e.target.getBoundingClientRect();
    const level = 1 - ((e.detail.y - rect.top) / rect.height);
    this.trackStartLevel = level;
    this.fire('power', {name: this.name, level: level});
    e.preventDefault();
  }

  private trackBar(e: any) {
    if (e.detail.state === 'start') {
      document.body.style.cursor = 'ns-resize';
    } else if (e.detail.state === 'end') {
      document.body.style.cursor = 'auto';
    }
    const rect = e.target.getBoundingClientRect();
    const level = this.trackStartLevel - (e.detail.dy / rect.height);
    this.fire('power', {name: this.name, level: level});
    e.preventDefault();
  }

  private height(level: number): string {
    return 'height:' + (level * 100).toFixed(3) + '%';
  }

  private percent(level: number): string {
    return Math.round(level * 100).toString();
  }

  private overheat(level: number): boolean { return level >= 0.9; }

  private idle(level: number): boolean { return level === 0; }
}
PowerBar.register();
