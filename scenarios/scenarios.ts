import {Db} from '../core/entity/db';

// Scenario is a playable mission.
export interface Scenario {
  name: string;
  description: string;

  start(db: Db)
}

export const scenarios: Scenario[] = [];

// registerScenario adds a scenario to the list of scenarios.
export function registerScenario(scenario: Scenario) {
  scenarios.push(scenario);
}

import DefaultScenario from './default';
registerScenario(new DefaultScenario());

import GoodLuckScenario from './goodluck';
registerScenario(new GoodLuckScenario());
