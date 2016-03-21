namespace Bridgesim.Client.Stations {
  @component('engineering-station')
  class Engineering extends polymer.Base {
    draw() {
      this.$.power.draw();
    }
  }

  Engineering.register();
}
