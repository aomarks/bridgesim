///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />


import {Settings} from './settings';

@component('bridgesim-side-panel')
class SidePanel extends polymer.Base {
  @property({type: Boolean, value: false}) connected: boolean;
  @property({type: Object}) settings: Settings;

  openSettings() { this.$.settingsDialog.open(); }

  disconnect() { this.fire('show-welcome'); }
}
SidePanel.register();
