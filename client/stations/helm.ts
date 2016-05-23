@component('helm-station')
class Helm extends polymer.Base {
  ready() { console.log('helm2 ready'); }
  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
    this.$.nav.draw(localAlpha);
    this.$.thrust.draw();
  }
}

Helm.register();
