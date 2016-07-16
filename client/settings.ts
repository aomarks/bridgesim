export interface Settings {
  // Draw entities at a position interpolated between the most recent two host
  // updates. Improves render smoothness at the cost up to one update interval
  // of latency.
  interpolate: boolean;

  // Milliseconds of artificial latency to introduce to all incoming and
  // outgoing network messages.
  fakeLatency: number;

  // Percentage [0,100] of all incoming and outgoing network messages that
  // will be artificially dropped.
  fakePacketLoss: number;

  // Maximum frames per second to draw. Unlimited when < 1.
  frameLimit: number;

  // The name of the current player.
  name: string;

  // Whether to draw bounding boxes on collidable entities.
  showBoundingBoxes: boolean;

  // Whether to render the collidable entries quadtree.
  showQuadtree: boolean;

  // Whether to render the paths that AI take.
  showPathfinding: boolean;

  // Whether to display debugging metrics (FPS, host snapshot rate, etc.).
  showMetrics: boolean;
}
