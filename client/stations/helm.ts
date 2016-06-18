///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../typings/index.d.ts" />

@component("helm-station")
class Helm extends polymer.Base {
  @property({type: Number, notify: true}) zoom: number;

  @listen("wheel")
  handleZoom(e: any) {
    let zoom = this.zoom + e.deltaY / 1000;
    if (zoom < 0) {
      zoom = 0;
    } else if (zoom > 1) {
      zoom = 1;
    }
    this.zoom = zoom;
    e.preventDefault();
  }

  @listen("map-tap")
  handleMapTap(e: any) {
    console.log("map-tap", e.detail.x, e.detail.y);
  }

  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
    this.$.headingIndicator.draw(localAlpha);
  }
}

Helm.register();
