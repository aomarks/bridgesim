///<reference path="const.ts" />

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function snap(px: number): number {
  return Math.round(px + HP) - HP;
}
