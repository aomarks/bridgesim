///<reference path='../bower_components/polymer-ts/polymer-ts.d.ts' />

import {Db} from '../core/entity/db';

@component('bridgesim-ftl')
export class Ftl extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: String, value: null}) x: string;
  @property({type: String, value: null}) y: string;
  @property({type: String, value: null}) eta: string;
  @property({type: Boolean, value: false}) expanded: boolean;

  @property({type: Boolean, computed: 'computeCanJump(x, y)'}) canJump: boolean;
  computeCanJump(x: string, y: string) { return !!x && !!y; }

  @property({type: Boolean, computed: 'computeContracted(expanded, eta)'})
  contracted: boolean;
  computeContracted(expanded: boolean, eta: string) {
    return !expanded && eta == null;
  }

  @property({type: Boolean, computed: 'computeCountdown(eta)'})
  countdown: boolean;
  computeCountdown(eta: string) { return eta != null; }

  spool() {
    this.fire('input', {
      spoolJump: {
        // Note paper-input produces strings.
        x: parseInt(this.x),
        y: parseInt(this.y),
      },
    });
  }

  toggle() { this.expanded = !this.expanded; }

  abort() { this.fire('input', {abortJump: true}); }

  @observe('shipId,db.ftl.*')
  private update(shipId: string, ftlChange: any) {
    if (!shipId || !ftlChange) {
      this.eta = null;
      return;
    }

    const ftl = this.db.ftl[shipId];
    if (!ftl || ftl.eta == null) {
      this.eta = null;
    } else {
      this.expanded = false;
      this.eta = ftl.eta < 0 ? 'IDLE' : ftl.eta.toFixed();
    }
  }
}
Ftl.register();
