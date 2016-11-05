///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />


@component('bridgesim-error-screen')
class ErrorScreen extends polymer.Base {
  home() { this.fire('show-welcome'); }
}
ErrorScreen.register();
