@component('helm-station')
class Helm extends polymer.Base {
  @property({type: Number, notify: true}) zoom: number;

  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
    this.$.headingIndicator.draw(localAlpha);
  }
}

Helm.register();
