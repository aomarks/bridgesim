///<reference path="../../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../../core/ship.ts" />

namespace Bridgesim.Client.Stations {
  @component('science-station')
  class Science extends polymer.Base {
    @property({type: Array, value: []}) ships: Core.Ship[];
    draw() {

    }
  }

  Science.register();
}
