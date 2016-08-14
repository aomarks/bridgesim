///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />

import {Db} from '../../core/entity/db';
import {dist, heading, clamp} from '../../core/math';
import {formatNumber} from '../../core/util';
import {MapTap} from '../map';
import {Point} from '../../core/components';

interface Target {
  id: string;
  name: string;
  distance: string;
  heading: string;
}

// Within how many screen pixels of a tap must an object be to be considered
// selected.
const TAP_RANGE = 20;

@component('science-station')
class Science extends polymer.Base {
  @property({type: Object}) db: Db;
  @property({type: String}) shipId: string;
  @property({type: Number, value: 0.2}) zoom: number;
  @property({type: String}) selectedId: string;
  @property({type: Object}) selected: Target;
  @property({type: Boolean, value: false}) scanning: boolean;
  @property({type: String}) scanResults: string;

  draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
  }

  @listen('wheel')
  handleZoom(e: any) {
    this.zoom = clamp(this.zoom + e.deltaY / 1000, 0, 1);
    e.preventDefault();
  }

  @listen('map-tap')
  handleMapTap(ev: MapTap) {
    if (!this.db) {
      return;
    }

    // TODO This approach doesn't account for object size. You might click
    // within an object's visible bounds, yet be closer to the center of some
    // other object. Maybe first check for collision box intersection, then
    // prefer center proximity.

    // Find the nearest selectable entity in world space.
    let nearestId: string = null;
    let nearestPos: Point = null;
    let nearestDist: number = null;
    // TODO Names is a hacky proxy for selectable things.
    for (const id in this.db.names) {
      const pos = this.db.positions[id];
      if (!pos) {
        continue;
      }
      const dst = dist(ev.detail.world, this.db.positions[id]);
      if (nearestDist === null || dst < nearestDist) {
        nearestId = id;
        nearestPos = pos;
        nearestDist = dst;
      }
    }

    if (nearestId !== null) {
      // Check if we tapped within a reasonable pixel radius in screen space.
      const screenDist = dist(
          ev.detail.screen,
          this.$.map.worldToScreen(nearestPos.x, nearestPos.y));
      if (screenDist <= TAP_RANGE) {
        this.selectedId = nearestId;
        return;
      }
    }

    // Tapped on nothing selectable. Close the info display.
    this.selectedId = null;
  }

  @observe('selectedId')
  observeSelectedId(selectedId: string) {
    if (!selectedId) {
      this.selected = null;
      return;
    }
    this.selected = {
      id: selectedId,
      name: this.db.names[selectedId].name,
      distance: this.dist(selectedId, this.shipId),
      heading: this.heading(selectedId, this.shipId),
    };
  }

  @observe('db.names.*')
  observeNames() {
    if (!this.selected) {
      return;
    }
    this.set('selected.name', this.db.names[this.selected.id].name);
  }

  @observe('db.positions.*')
  observePositions(change: any) {
    if (!this.shipId || !this.selected) {
      return;
    }
    if (change.path.indexOf('db.positions.' + this.shipId + '.') !== 0 &&
        change.path.indexOf('db.positions.' + this.selected.id + '.') !== 0) {
      return;
    }
    this.set('selected.distance', this.dist(this.selectedId, this.shipId));
    this.set('selected.heading', this.heading(this.selectedId, this.shipId));
  }

  @observe('selected')
  public hideResults() {
    this.scanResults = null;
  }

  public scan(): void {
    this.scanning = true;
    this.scanResults = null;
    setTimeout(() => {
      this.scanning = false;
      this.scanResults = 'Goats Teleported: ' + Math.random() * 100000;
    }, 1000);
  }

  public dist(a: string, b: string): string {
    const distance = dist(this.db.positions[a], this.db.positions[b]);
    return formatNumber(distance) + 'm';
  }

  public heading(a: string, b: string): string {
    const bearing = heading(this.db.positions[a], this.db.positions[b]);
    return bearing.toFixed(0) + '°';
  }
}

Science.register();
