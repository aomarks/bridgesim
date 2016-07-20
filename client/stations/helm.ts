///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../typings/index.d.ts" />

import {clamp} from '../../core/math';

@component('helm-station')
class Helm extends polymer.Base {
  @property({type: Number, value: 0.8}) zoom: number;

  @listen('wheel')
  handleZoom(e: any) {
    this.zoom = clamp(this.zoom + e.deltaY / 1000, 0, 1);
    e.preventDefault();
  }

  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
    this.$.headingIndicator.draw(localAlpha);
  }
}

Helm.register();
