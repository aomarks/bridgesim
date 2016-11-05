///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';
import {Weapon, WeaponType} from '../core/weapon';

@component('weapon-selector')
export class WeaponSelector extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: Object, notify: true}) selected: Weapon;

  weapons(id: string): Weapon[] {
    const health = this.db.healths[id];
    if (!health) {
      return undefined;
    }
    if (!this.selected) {
      this.selected = health.weapons[0];
    }
    return health.weapons;
  }

  weaponName(type: WeaponType): string { return WeaponType[type]; }

  select(e: {model: {item: Weapon}}): void { this.selected = e.model.item; }

  isSelected(selected: Weapon): boolean { return selected === this.selected; }
}
WeaponSelector.register();
