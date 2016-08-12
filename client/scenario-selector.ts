///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Scenario, scenarios} from '../scenarios/scenarios';

@component('scenario-selector')
export class ScenarioSelector extends polymer.Base {
  @property({type: Object, notify: true, value: ()=> scenarios[0]})
  scenario: Scenario;
  @property({type: Array}) scenarios: Scenario[]=scenarios;

  ready(): void {}

  select(e: {model: {item: Scenario}}): void { this.scenario = e.model.item; }

  selected(scenario: Scenario): boolean { return scenario === this.scenario; }
}
ScenarioSelector.register();
