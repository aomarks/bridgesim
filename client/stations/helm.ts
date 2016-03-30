namespace Bridgesim.Client.Stations {
  @component('helm-station')
  class Helm extends polymer.Base {
    draw(alpha: number) {
      this.$.map.draw(alpha);
      this.$.nav.draw();
      this.$.thrust.draw();
    }
  }

  Helm.register();
}
