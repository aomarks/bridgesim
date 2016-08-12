import {Db} from '../core/entity/db';
import {SpawnShip} from '../core/entity/ship';
import {SpawnStation} from '../core/entity/station';
import {randCoord} from '../core/galaxy';
import {Settings} from '../core/host';

export default class GoodLuckScenario {
  public name: string = 'Good Luck!';
  public description: string = 'An unbeatable scenario.';

  public start(db: Db, settings: Settings) {
    const rand = () => randCoord(settings.galaxySize);
    SpawnStation(db, null, rand(), rand());
    for (let i = 0; i < 20; i++) {
      SpawnShip(db, null, rand(), rand(), true, -1);
    }
  }
}
