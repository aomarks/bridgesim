namespace Bridgesim.Client.Stations {
  @component('helm-station')
  class Helm extends polymer.Base {
    draw(localAlpha: number, remoteAlpha: number) {
      this.$.map.draw(localAlpha, remoteAlpha);
      this.$.nav.draw(localAlpha);
      this.$.thrust.draw();
    }
  }

  Helm.register();
}
