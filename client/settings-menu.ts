///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="settings.ts" />

namespace Bridgesim.Client {

  @component('bridgesim-settings-menu')
  class SettingsMenu extends polymer.Base {
    @property({type: Object}) settings: Settings;
  }
  SettingsMenu.register();
}
