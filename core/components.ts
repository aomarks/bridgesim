import * as Net from "../net/message";

export interface Player {
  name: string;
  shipId: string;
  station: Net.Station;
  inputs: Net.Commands[];
  latestSeq: number;
}

// An entity's position and orientation in space.
export interface Position {
  x: number;
  y: number;
  yaw: number;
  roll: number;
}

// An entity's bounding box in collision space.
export interface Collidable {
  length: number;
  width: number;
  ignore?: string;

  // TODO Move to other systems.
  mass: number;
  damage: number;
}

export interface Health {
  hp: number;
  shields: boolean;
}

export interface Power {
  engine: number;
  maneuvering: number;
}

export enum DebrisType {
  ASTEROID,
}

export interface Debris { type: DebrisType; }

export interface Station {
  resources: {[type: string]: number};
  // station produces one resource every n seconds.
  produces: {[type: string]: number};
}
