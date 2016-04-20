///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../renderer/renderer.ts" />

namespace Bridgesim.Client.Stations {

  @component('viewscreen-station')
  class Viewscreen extends polymer.Base {
    private active: boolean = false;
    private renderer: Bridgesim.Client.Renderer.Renderer;

    draw(localAlpha: number, remoteAlpha: number) {
      if (!this.active) {
        this.renderer = null;
        return;
      }
      if (!this.renderer) {
        this.renderer = this.$$('#renderer');
      }
      this.renderer.draw(localAlpha, remoteAlpha);
    }

    attached() {
      this.parentNode.addEventListener('iron-select', this.select.bind(this));
    }

    select(e: Event) {
      this.active = (this.parentNode as any).selectedItem === this;
    }
  }

  Viewscreen.register();
}
