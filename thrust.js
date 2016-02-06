'use strict';

let thrustCan, thrustCtx;

function initThrust() {
  thrustCan = document.getElementById('thrust');
  thrustCtx = thrustCan.getContext('2d');
}

function drawThrust() {
  var w = thrustCan.width;
  var h = thrustCan.height;
  thrustCtx.clearRect(0, 0, w, h);

  thrustCtx.strokeStyle = '#AAA';
  thrustCtx.strokeRect(0, 0, w, h);
  
  thrustCtx.fillStyle = '#FFF';
  let bar = h/20;
  let foo = h - bar;
  thrustCtx.fillRect(0, foo-(foo*ship.thrust), w, bar);
}
