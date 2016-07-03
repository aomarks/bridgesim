/**
 * A Component is an object containing data for some aspect of an entity, such
 * as its position coordinate or health level.
 *
 * Implementations should extend this class and decorate all properties with
 * @Component.prop.
 *
 * Example:
 *
 *   class Position extends Component {
 *     @Component.prop x: number = 0;
 *     @Component.prop y: number = 0;
 *   }
 */
export class Component {
  /** Set on the prototype by @Component.prop. */
  props: string[];

  /**
   * Whether any change has occured since the last clearChange(). True at
   * instantiation.
   */
  changed: boolean = true;

  /**
   * Property values that have changed since the last clearChange(). Contains
   * default values at instantation.
   */
  change: Object = {};

  clearChange(): void {
    this.change = {};
    this.changed = false;
  }

  /** Generate a full snapshot of this object. */
  full(): Object {
    const full = {};
    for (const prop of this.props || []) {
      full[prop] = this[prop];
    }
    return full;
  }

  /**
   * All component implementation properties should use this decorator to set
   * up automatic change tracking.
   */
  static prop(prototype: any, name: string) {
    // Store the actual value at this property.
    const real = name + '_';

    // Define the getter and setter that track changes.
    Object.defineProperty(prototype, name, {
      get: function() { return this[real]; },
      set: function(val: any) {
        if (val !== this[real]) {
          this[real] = val;
          this.change[name] = val;
          this.changed = true;
        }
      },
    });

    // Remember properties for use in full().
    if (!prototype.props) {
      prototype.props = [];
    }
    prototype.props.push(name);
  }
}

/**
 * A Database stores all entity components and generates changesets.
 *
 * Implementations should extend this class and decorate all component tables
 * with @Database.table.
 *
 * Example:
 *
 *   class MyDatabase extends Database {
 *     @Database.table(Position) position: {[id: string]: Position} = {};
 *     newPosition(id: string): Position { return this['newPosition_'](id); }
 *   }
 */
export class Database {
  /** Set on the prototype by Database.@table. */
  private components: {string: {new (): Component}};

  /** Entity IDs that have been removed since the last changeset. */
  private removed: string[] = [];

  /**
   * Next entity ID to hand out.
   */
  private nextId: number = 0;

  /** Create a new entity ID. */
  spawn(): string { return (this.nextId++).toString(); }

  /** Delete an entity from all component tables. */
  remove(id: string) {
    this.removed.push(id);
    for (const component in this.components) {
      delete this[component][id];
    }
  }

  /**
   * Bundle all changes seen since the last call to changes(), and clear all
   * component changes. Returns null if nothing changed.
   */
  changes(): Update {
    let changes = false;
    const update: Update = {};
    for (const component in this.components) {
      for (const id in this[component]) {
        const com: Component = this[component][id];
        if (com.changed) {
          if (!update.components) {
            update.components = {};
          }
          if (!update.components[component]) {
            update.components[component] = {};
          }
          update.components[component][id] = com.change;
          com.clearChange();
          changes = true;
        }
      }
    }
    if (this.removed.length) {
      update.removed = this.removed;
      this.removed = [];
      changes = true;
    }
    return changes ? update : null;
  }

  /**
   * Generate a full snapshot of the database.
   */
  full(): Update {
    const update: Update = {full: true, components: {}};
    for (const component in this.components) {
      for (const id in this[component]) {
        const com: Component = this[component][id];
        if (!update.components[component]) {
          update.components[component] = {};
        }
        update.components[component][id] = com.full();
      }
    }
    return update;
  }

  /**
   * Apply changes or a full snapshot to this database.
   */
  apply(update: Update) {
    const touchedIds = {};

    for (const component in update.components) {
      if (!this[component]) {
        console.error('unknown component:', component);
        continue;
      }
      for (const id in update.components[component]) {
        let com = this[component][id];
        if (!com) {
          com = this[component][id] = new this.components[component];
        }
        for (const prop in update.components[component][id]) {
          com[prop] = update.components[component][id][prop];
        }
        if (update.full) {
          touchedIds[id] = true;
        }
      }
    }

    if (update.removed) {
      for (const id of update.removed) {
        this.remove(id);
      }
    }

    if (update.full) {
      for (const component in this.components) {
        for (const id in this[component]) {
          if (!touchedIds[id]) {
            this.remove(id);
          }
        }
      }
    }
  }

  /**
   * All database implementations should use this decorator to set up a
   * component table.
   */
  static table(component: {new (): Component}) {
    return function(prototype: any, name: string) {
      // Remember the component constructor for use in apply().
      if (!prototype.components) {
        prototype.components = {};
      }
      prototype.components[name] = component;

      // Create a "newFoo_" function that makes a new instance of this
      // component and adds it to the corresponding table.
      const fn = 'new' + name.charAt(0).toUpperCase() + name.slice(1) + '_';
      prototype[fn] = function(id: string) {
        const com = new component;
        this[name][id] = com;
        return com;
      };
    };
  }
}

export interface Update {
  full?: boolean;
  removed?: string[];
  hostSeq?: number;    // Host sequential ID for this update.
  clientSeq?: number;  // Latest integrated client input sequence ID.
  components?: {[component: string]: Object};
}
