///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />


@component('bridgesim-welcome-screen')
class WelcomeScreen extends polymer.Base {
  private fireJoin() { this.fire('join'); }
  private fireHost() { this.fire('host'); }
}
WelcomeScreen.register();
