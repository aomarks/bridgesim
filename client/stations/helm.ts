namespace Bridgesim.Client.Stations {
  @component('helm-station')
  class Helm extends polymer.Base {
    draw() {
      this.$.map.draw();
      this.$.nav.draw();
      this.$.thrust.draw();
    }
  }

  Helm.register();  
}
