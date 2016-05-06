///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />

namespace Bridgesim.Client {

  export interface Settings {
    // Predict the result of input for locally controlled entities before we
    // receive the canonical result from the next host snapshot. Improves
    // input responsiveness at the cost of occasional snap when prediction was
    // wrong.
    localPredict: boolean;

    // Draw locally controlled entities at a position interpolated between the
    // most recent two ticks. Improves render smoothness at the cost of up to
    // one tick interval of latency.
    localInterpolate: boolean;

    // Draw remote controlled entities at a position interpolated between the
    // most recent two host snapshots. Improves render smoothness at the cost
    // up to one snapshot interval of latency.
    remoteInterpolate: boolean;

    // Milliseconds of artificial latency to introduce to all incoming and
    // outgoing network messages.
    fakeLatency: number;

    // Percentage [0,100] of all incoming and outgoing network messages that
    // will be artificially dropped.
    fakePacketLoss: number;

    // Milliseconds between simulation ticks. Must match host.
    tickInterval: number;

    // Expected milliseconds between host snapshot broadcasts. Must match host.
    snapshotInterval: number;

    // How many of the most recent input command objects to store. When local
    // prediction is enabled and we receive a host snapshot, this buffer is
    // used to catch up our prediction. The older the snapshot, the more input
    // we need to re-apply.
    commandBufferSize: number;

    // The name of the current player.
    name: string;
  }
}
