import {Db} from '../core/entity/db';
import {SpawnAstroidBelt} from '../core/entity/debris';
import {SpawnShip} from '../core/entity/ship';
import {SpawnStation} from '../core/entity/station';
import {randCoord} from '../core/galaxy';

export default class DefaultScenario {
  public name: string = 'Default';
  public description: string =
      'A playable scenario mostly for testing purposes.';

  public start(db: Db) {
    const rand = () => randCoord(db.findSettings().galaxySize);
    SpawnShip(db, 'Mean', rand(), rand(), true, -1);
    SpawnShip(db, 'Neutral', rand(), rand(), true, 0);
    SpawnShip(db, 'Friendly', rand(), rand(), true, 1);
    for (let i = 0; i < 2; i++) {
      SpawnStation(db, null, rand(), rand());
    }
    for (let i = 0; i < 5; i++) {
      SpawnAstroidBelt(db, rand(), rand(), rand(), rand());
    }
  }
}
