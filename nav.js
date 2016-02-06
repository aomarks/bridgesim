'use strict';

let navCan, navCtx;

function initNav() {
  navCan = document.getElementById('nav');
  navCtx = navCan.getContext('2d');
}

function drawNav() {
  var w = navCan.width;
  var h = navCan.height;
  navCtx.clearRect(0, 0, w, h);
  
  navCtx.beginPath();
  navCtx.arc(w/2 + .5, w/2 + .5, w/2 - 5, 0, 2 * Math.PI);
  navCtx.fillStyle = '#333';
  navCtx.fill();
  navCtx.strokeStyle = '#555';
  navCtx.stroke();

  let angle = radians(ship.heading - 90);
  navCtx.beginPath();
  navCtx.moveTo(w/2 + .5, w/2 + .5);
  navCtx.lineTo(
    Math.cos(angle) * (w/2 - 8) + w/2 + .5,
    Math.sin(angle) * (w/2 - 8) + w/2 + .5
  )
  navCtx.strokeStyle = '#ff0000';
  navCtx.lineWidth = 2;
  navCtx.stroke();
}
