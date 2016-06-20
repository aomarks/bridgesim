///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '..//core/entity/db';

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
      const nameA = (this.db.names[a] || '').toUpperCase();
      const nameB = (this.db.names[b] || '').toUpperCase();
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

  public idName(names: any, id: string): string { return names[id] || ''; }
}

AnimateSelector.register();
