@component('helm2-station')
class Helm2 extends polymer.Base {
  @property({type: Number, notify: true}) zoom: number;

  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map2.draw(localAlpha, remoteAlpha);
    this.$.headingIndicator.draw(localAlpha);
  }
}

Helm2.register();
