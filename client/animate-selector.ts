///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../core/entity/db';

interface Selected {
  animate: string;
}

@component('animate-selector')
class AnimateSelector extends polymer.Base {
  @property({type: Object}) public db: Db;
  @property({type: String, notify: true, computed: 'computeSelected(sel)'})
  public selected: string;

  public sel: Selected;

  public computeSelected(sel: Selected) { return sel && sel.animate; }

  public ids(dict: any): string[] {
    const ids = Object.keys(dict);
    ids.sort((a, b) => {
      const nameA = this.getName(a).toUpperCase();
      const nameB = this.getName(b).toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
    return ids;
  }

  public getName(id): string {
    const com = this.db.names[id];
    return com ? com.name : '';
  }

  public idName(names: any, id: string): string { return this.getName(id); }
}

AnimateSelector.register();
