///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

@component('bridgesim-error-screen')
class ErrorScreen extends polymer.Base {
  home() {
    this.window.hash = '';
    this.fire('disconnect');
  }
}
ErrorScreen.register();
