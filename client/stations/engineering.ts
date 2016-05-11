@component('engineering-station')
class Engineering extends polymer.Base {
  draw() { this.$.power.draw(); }
}

Engineering.register();
