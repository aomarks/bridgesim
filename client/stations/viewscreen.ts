///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Renderer} from '../renderer/renderer';

@component('viewscreen-station')
class Viewscreen extends polymer.Base {
  @property({type: Boolean}) active: boolean;
  private renderer: Renderer;

  draw(localAlpha: number, remoteAlpha: number) {
    if (this.renderer) {
      this.renderer.draw(localAlpha, remoteAlpha);
    }
  }

  @observe('active')
  activeChanged(active: boolean) {
    if (active) {
      // Wait for the dom-if to stamp out.
      this.async(() => { this.renderer = this.$$('#renderer'); });
    } else {
      this.renderer = null;
    }
  }
}
Viewscreen.register();
