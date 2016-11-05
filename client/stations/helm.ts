///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />


import {clamp} from '../../core/math';
import * as Net from '../../net/message';

// TODO: Key codes are kind of a mess. This should work for Chrome at least.
// See http://unixpapa.com/js/key.html
function keyCode(ch: string): number {
  return ch.charCodeAt(0);
}

interface KeyState {
  // Command to run when key is down. If up is also set, this command is
  // persistent.
  down: () => Net.Commands;
  // Command to run when key is up.
  up?: () => Net.Commands;
  isDown?: boolean;
}

@component('helm-station')
class Helm extends polymer.Base {
  @property({type: Number, value: 0.8}) zoom: number;
  @property({type: Boolean}) active: boolean;

  public draw(localAlpha: number, remoteAlpha: number) {
    this.$.map.draw(localAlpha, remoteAlpha);
    this.$.headingIndicator.draw(localAlpha);
  }

  @listen('wheel')
  private handleZoom(e: any) {
    this.zoom = clamp(this.zoom + e.deltaY / 1000, 0, 1);
    e.preventDefault();
  }

  private keys: {
    [key: number]: KeyState,
  } = {
    [keyCode('W')]: {
      down: () => { return {thrust: 1}; },
      up: () => { return {thrust: 0}; }
    },
    [keyCode('S')]: {
      down: () => { return {thrust: -1}; },
      up: () => { return {thrust: 0}; }
    },
    [keyCode('A')]: {
      down: () => { return {turn: -1}; },
      up: () => { return {turn: 0}; },
    },
    [keyCode('D')]: {
      down: () => { return {turn: 1}; },
      up: () => { return {turn: 0}; },
    },
    [keyCode('Z')]: {
      down: () => { return {toggleShield: true}; },
    },
  };


  private onKeydown(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }
    const key = this.keys[event.keyCode];
    if (key) {
      key.isDown = true;
      const cmd = key.down();
      if (key.up) {
        this.fire('input-persistent', cmd);
      } else {
        this.fire('input', cmd);
      }
    }
  }

  private onKeyup(event: KeyboardEvent): void {
    this.keyup(this.keys[event.keyCode]);
  }

  private keyup(key: KeyState) {
    if (!key) {
      return;
    }
    if (key.up && key.isDown) {
      this.fire('input-persistent', key.up());
    }
    key.isDown = false;
  }

  private onBlur(): void {
    for (let code in this.keys) {
      this.keyup(this.keys[code]);
    }
  }

  private keyHandlers: {[event: string]: () => void} = {
    'keydown': this.onKeydown.bind(this),
    'keyup': this.onKeyup.bind(this),
    'blur': this.onBlur.bind(this),
  };

  @observe('active')
  public activeUpdate(active: boolean): void {
    for (let ev in this.keyHandlers) {
      const handler = this.keyHandlers[ev];
      if (active) {
        window.addEventListener(ev, handler);
      } else {
        window.removeEventListener(ev, handler);
      }
    }
  }

  startLeftTurn() { this.fire('input-persistent', {turn: -1}); }
  startRightTurn() { this.fire('input-persistent', {turn: 1}); }
  stopTurn() { this.fire('input-persistent', {turn: 0}); }
}

Helm.register();
