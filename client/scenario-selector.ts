///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Scenario, scenarios} from '../scenarios/scenarios';

@component('scenario-selector')
export class ScenarioSelector extends polymer.Base {
  @property({type: Object, notify: true, value: ()=> scenarios[0]})
  scenario: Scenario;
  @property({type: Array}) scenarios: Scenario[]=scenarios;
  @property({type: Boolean, value: false}) disabled;
}
ScenarioSelector.register();
