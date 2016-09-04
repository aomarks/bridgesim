///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';
import {Message} from '../net/message';
import {Scenario, scenarios} from '../scenarios/scenarios';

@component('scenario-selector')
export class ScenarioSelector extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: Array, value: ()=> scenarios}) scenarios: Scenario[];
  @property({type: String}) selected: string;
  @property({type: Boolean, value: false}) disabled;

  private select() {
    this.fire('net-send', <Message>{
      updateSettings: {scenarioName: this.selected},
    });
  }

  @observe('db.settings.*')
  private settingsChanged() {
    if (!this.db) {
      return;
    }
    const settings = this.db.findSettings();
    if (!settings) {
      return;
    }
    this.selected = settings.scenarioName;
  }
}
ScenarioSelector.register();
