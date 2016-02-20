'use strict';

function radians(degrees) {
  return (degrees * Math.PI) / 180;
}

function snap(px) {
  return Math.round(px + HP) - HP;
}
