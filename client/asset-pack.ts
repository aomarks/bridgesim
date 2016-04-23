///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

namespace Bridgesim.Client.AssetPack {

  interface Manifest {
    ships: Ship[]
  }

  interface Ship {
    class: string
    faction: string
    model: string
  }

  @component('asset-pack')
  class AssetPack extends polymer.Base {
    @property({ type: String })
    manifest: string;

    @property({ type: Object })
    manifestBody: Manifest;

    @computed()
    baseURL(manifest: string) {
      return this.urlDir(manifest);
    }

    @computed()
    ships(manifestBody: Manifest) {
      return manifestBody.ships;
    }

    urlDir(url: string) {
      return url.substring(0, Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"))) + '/';
    }
  }

  AssetPack.register();
}
