'use strict';

let thrustCan, thrustCtx;

function initThrust() {
  thrustCan = document.getElementById('thrust');
  thrustCtx = thrustCan.getContext('2d');
}

function drawThrust() {
  let w = thrustCan.width - 1;
  let h = thrustCan.height - 1;
  thrustCtx.clearRect(0, 0, w, h);

  thrustCtx.strokeStyle = '#AAA';
  thrustCtx.strokeRect(HP, HP, w, h);

  thrustCtx.fillStyle = '#FFF';
  let barHeight = Math.round(h/20);
  let maxHeight = h - barHeight;

  thrustCtx.fillRect(
    HP,
    snap(maxHeight - (ship.thrust * maxHeight)),
    w,
    barHeight);
}
