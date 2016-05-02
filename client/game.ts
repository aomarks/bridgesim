///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/browser.d.ts" />
///<reference path="../core/ship.ts" />
///<reference path="../core/host.ts" />
///<reference path="../core/projectile.ts" />
///<reference path="../net/message.ts" />
///<reference path="../net/webrtc.ts" />
///<reference path="../net/loopback.ts" />
///<reference path="../net/conditioner.ts" />
///<reference path="const.ts" />
///<reference path="settings.ts" />
///<reference path="map.ts" />
///<reference path="nav.ts" />
///<reference path="thrust.ts" />
///<reference path="power.ts" />
///<reference path="chat.ts" />

namespace Bridgesim.Client {

  const RTC_CONFIG: RTCConfiguration = {
    iceServers: [{urls: 'stun:stun.1.google.com:19302'}]
  };

  @component('bridgesim-game')
  class Game extends polymer.Base {
    @property({type: Number, value: 100}) size: number;
    @property({type: Object}) settings: Settings;
    @property({type: Object}) roster: Net.Roster;
    @property({type: Object}) routeData: {station: string};
    @property({type: Boolean, value: false}) isHost: boolean;
    @property({type: Boolean, value: true}) serverHidden: boolean;
    @property({type: Object}) ship: Core.Ship;
    @property({type: Array}) ships: Core.Ship[];

    private host: Core.Host;
    private conn: Net.Connection;
    private conditioner: Net.Conditioner;

    private clientId: number;
    private projectiles: {[id: number]: Core.Projectile};
    private shipId: number;
    private players: Net.Player[];

    private latestSnapshot: Net.Snapshot;
    private latestSnapshotMs: number = 0;
    private latestSeq = -1;
    private seq: number = 0;
    private commandBuffer: Net.Commands[] = [];

    private prevTs: number = 0;
    private lag: number = 0;

    private urlQuery: string;

    private animationRequestId: number;
    private welcomed: boolean;

    ready(): void {
      this.settings = {
        localPredict: true,
        localInterpolate: true,
        remoteInterpolate: true,
        fakeLatency: 0,
        fakePacketLoss: 0,
        tickInterval: 0,      // Server controlled.
        snapshotInterval: 0,  // Server controlled.
        commandBufferSize: 100,
      };

      this.ships = [];

      if (this.urlQuery.indexOf('host') != -1) {
        this.isHost = true;
      } else if (this.urlQuery.indexOf('client') != -1) {
        this.$.peerLocalstorage.makeOffer();
      }

      if (!this.routeData.station) {
        // TODO Why doesn't iron-location hash binding work?
        // TODO Is there some smarter way to do this using the route?
        window.location.hash = '/station/helm';
      }
    }

    openSettingsDialog(): void { this.$.settingsDialog.open(); }

    openLobbyDialog(): void { this.$.lobbyDialog.open(); }

    @observe('isHost')
    isHostChanged(isHost: boolean): void {
      this.resetSimulation();
      this.resetNetwork();
      if (isHost) {
        this.host = new Core.Host();
        this.host.start();

        const loopback = new Net.Loopback();
        this.conn = loopback.a;
        this.setupConn();
        this.host.addConnection(loopback.b);
        console.log('game: opening loopback connection');
        loopback.open();

        setTimeout(()=>{
          (this.querySelector('#lobbyHost') as any).offer = this.offer.bind(this);
        },1);
      }
    }

    @observe('settings.fakeLatency')
    fakeLatencyChanged(val: number) {
      if (this.conditioner) {
        this.conditioner.latency = val;
      }
    }

    @observe('settings.fakePacketLoss')
    fakePacketLossChanged(val: number) {
      if (this.conditioner) {
        this.conditioner.packetLoss = val / 100;
      }
    }

    resetSimulation() {
      if (this.animationRequestId != null) {
        cancelAnimationFrame(this.animationRequestId);
        this.animationRequestId = null;
      }
      this.ship = null;
      this.ships = [];
      this.shipId = null;
      this.latestSnapshot = null;
      this.latestSeq = -1;
      this.prevTs = 0;
      this.lag = 0;
      this.welcomed = false;
      console.log('game: reset simulation');
    }

    resetNetwork() {
      if (this.conn) {
        this.conn.close();
        this.conn = null;
      }
      if (this.host) {
        this.host.stop();
        this.host = null;
      }
      this.clientId = null;
      console.log('game: reset network');
    }

    onConnection(event: {detail: Net.Connection}): void {
      if (this.isHost) {
        this.host.addConnection(event.detail);
      } else {
        this.conn = event.detail;
        this.setupConn();
      }
    }

    setupConn() {
      this.conditioner = new Net.Conditioner(this.conn);
      this.conditioner.latency = this.settings.fakeLatency;
      this.conditioner.packetLoss = this.settings.fakePacketLoss;
      this.conn = this.conditioner;

      this.conn.onMessage = this.onMessage.bind(this);
      this.conn.onClose = () => {
        console.log('game: disconnected from host');
        this.resetSimulation();
      };

      console.log('game: sending hello');
      this.conn.send({hello: {name: 'stranger'}}, true);
    }

    joinGame(): void { this.$.peerCopypaste.openClientDialog(); }
    invitePlayer(): void { this.$.peerCopypaste.openHostDialog(); }
    offer(offer: any, resolve: (resp: any)=>void): void {
      this.$.peerCopypaste.handleOffer(offer.Offer).then((answer: string) => {
        resolve({Answer: answer});
      });
    }

    onMessage(msg: Net.Message) {
      if (msg.welcome) {
        console.log('game: got welcome', msg.welcome.clientId);
        this.settings.tickInterval = msg.welcome.tickInterval;
        this.settings.snapshotInterval = msg.welcome.snapshotInterval;
        this.clientId = msg.welcome.clientId;
        this.applyRoster(msg.welcome.roster);
        this.applySnapshot(msg.welcome.snapshot);
        this.welcomed = true;
        this.frame(0);

      } else if (!this.welcomed) {
        return;

      } else if (msg.roster) {
        console.log('game: got roster');
        this.applyRoster(msg.roster);

      } else if (msg.receiveChat) {
        this.$.chat.receiveMsg(msg.receiveChat);

      } else if (msg.snapshot) {
        if (msg.snapshot.seq > this.latestSeq) {
          this.latestSnapshotMs = performance.now();
          this.latestSnapshot = msg.snapshot;
          this.latestSeq = msg.snapshot.seq;
        }
      }
    }

    applyRoster(roster: Net.Roster) {
      this.roster = roster;
      for (let ship of this.roster.ships) {
        if (!this.ships[ship.id]) {
          this.ships[ship.id] = new Core.Ship(ship.id, ship.name, 0, 0, 0);
          this.notifySplices('ships', [
            { index: ship.id, removed: [], addedCount: 1, object: this.ships, type: 'splice' },
          ]);
        }
        for (let assignment of ship.crew) {
          if (assignment.playerId == this.clientId) {
            this.shipId = ship.id;
            this.ship = this.ships[ship.id];
          }
        }
      }
    }

    sendChat(event: {detail: ChatEvent}): void {
      this.conn.send({sendChat: {text: event.detail.text}}, true);
    }

    joinCrew(event: {detail: Net.JoinCrew}): void {
      this.conn.send({joinCrew: event.detail}, true);
    }

    createShip(event: {detail: Net.CreateShip}): void {
      this.conn.send({createShip: {}}, true);
    }

    applySnapshot(snapshot: Net.Snapshot): void {
      snapshot.ships.forEach(u => {
        const ship = this.ships[u.shipId];
        if (!ship) {
          console.warn('game: unknown ship', u.shipId);
          return;
        }
        ship.body.setX(u.x);
        ship.body.setY(u.y);
        ship.body.setYaw(u.yaw);
        ship.thrust = u.thrust;
        ship.hp = u.hp;
      });

      // TODO Memory inefficient.
      const newProjectiles: {[id: number]: Core.Projectile} = {};
      snapshot.projectiles.forEach(p => {
        let proj = this.projectiles[p.shipId];
        if (proj) {
          proj.body.setX(p.x);
          proj.body.setY(p.y);
          proj.body.setYaw(p.yaw);
        } else {
          proj = new Core.Projectile(p.shipId, p.x, p.y, p.yaw);
        }
        newProjectiles[proj.id] = proj;
      });
      this.projectiles = newProjectiles;
    }

    frame(ts: number): void {
      this.animationRequestId = requestAnimationFrame(this.frame.bind(this));

      if (this.latestSnapshot) {
        this.applySnapshot(this.latestSnapshot);
        if (this.settings.localPredict && this.shipId != null) {
          const offset = this.seq - this.latestSnapshot.seq;
          const length = this.commandBuffer.length;
          for (let i = length - offset + 1; i < length; i++) {
            const commands = this.commandBuffer[i];
            if (commands) {
              this.ship.applyCommands(commands);
            }
            this.ship.tick();
          }
        }
        this.latestSnapshot = null;
      }

      const elapsed = ts - this.prevTs;
      this.lag += elapsed;

      let commands: Net.Commands;
      while (this.lag >= this.settings.tickInterval) {
        commands = this.$.input.process();
        commands.seq = this.seq;
        if (this.commandBuffer.length === this.settings.commandBufferSize) {
          this.commandBuffer.shift();
        }
        this.commandBuffer.push(commands);

        if (this.settings.localPredict && this.shipId != null) {
          this.ship.applyCommands(commands);
          this.ship.tick();
        }
        this.lag -= this.settings.tickInterval;
        this.seq++;
      }
      if (commands) {
        this.conn.send({commands: commands}, false);
      }

      const station = this.$.stations.selectedItem;
      if (station && this.shipId != null) {
        let localAlpha = this.lag / this.settings.tickInterval;
        let remoteAlpha = Math.min(
            1, (ts - this.latestSnapshotMs) / this.settings.snapshotInterval);

        if (!this.settings.localInterpolate) {
          localAlpha = 1;
        } else if (!this.settings.localPredict) {
          localAlpha = remoteAlpha;
        }
        if (!this.settings.remoteInterpolate) {
          remoteAlpha = 1;
        }

        station.draw(localAlpha, remoteAlpha);
      }

      this.prevTs = ts;
    }
  }
  Game.register();
}
