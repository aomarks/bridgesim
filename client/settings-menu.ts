///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Settings} from "./settings";

@component('bridgesim-settings-menu')
class SettingsMenu extends polymer.Base {
  @property({type: Object, notify: true}) settings: Settings;

  initializeDefaultName() {
    this.set('settings.name', 'Player ' + (Math.random() * 1000).toFixed(0));
  }
}
SettingsMenu.register();
