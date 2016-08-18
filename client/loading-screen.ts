///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

@component('bridgesim-loading-screen')
class LoadingScreen extends polymer.Base {
  @property({type: Boolean, value: false}) active: boolean;
}
LoadingScreen.register();
