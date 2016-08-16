///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

@component('bridgesim-welcome')
class Welcome extends polymer.Base {
  private fireJoin() { this.fire('join'); }
  private fireHost() { this.fire('host'); }
}
Welcome.register();
