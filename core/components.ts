import {Station as CrewStation} from '../net/message';
import {Commands} from '../net/message';
import {Component} from './comdb';
import {Weapon} from './weapon';

// Point represents a single x, y position.
export interface Point {
  x: number;
  y: number;
}

// An entity's position and orientation in space.
// TODO Name collides with Position component.
export interface PositionInterface extends Point {
  yaw: number;
  roll: number;
}

// Region is a point, width and height.
export interface Region extends Point {
  width: number;
  height: number;
}

export class Ai extends Component {
  @Component.prop targetPos: Point;
  @Component.prop friendliness: number;
}

export class Collidable extends Component {
  @Component.prop length: number = 0;
  @Component.prop width: number = 0;
  @Component.prop ignore: string = '';
  @Component.prop mass: number = 0;
  @Component.prop damage: number = 0;
}

export class Debris extends Component { @Component.prop type: DebrisType; }

export enum DebrisType {
  ASTEROID,
}

export class Health extends Component {
  @Component.prop hp: number = 0;
  @Component.prop shields: boolean = false;
  @Component.prop weapons: Weapon[] = [];
}

export class Name extends Component { @Component.prop name: string = ''; }

export class Odometer extends Component { @Component.prop meters: number = 0; }

export class Laser extends Component {
  range: number;
}

export class Missile extends Component {
  range: number;
}

export class Player extends Component {
  @Component.prop name: string = '';
  @Component.prop shipId: string = '';
  @Component.prop station: CrewStation;

  inputs: Commands[] = [];
  latestSeq: number = null;
}

export class Position extends Component {
  @Component.prop x: number = 0;
  @Component.prop y: number = 0;
  @Component.prop yaw: number = 0;
  @Component.prop roll: number = 0;
}

export class Power extends Component {
  @Component.prop engine: number = 0;       // [0,1]
  @Component.prop maneuvering: number = 0;  // [0,1]
}

export class Resources extends Component {
  @Component.prop energy: number = 0;
  @Component.prop missile: number = 0;
}

export class Ship extends Component {}

export class Station extends Component {
  // station produces one resource every n seconds.
  @Component.prop produces: {[type: string]: number} = {};
}

export class Motion extends Component {
  @Component.prop thrust: number = 0;
  @Component.prop velocityX = 0;
  @Component.prop velocityY = 0;
}
