'use strict';

let navCan, navCtx;

function initNav() {
  navCan = document.getElementById('nav');
  navCtx = navCan.getContext('2d');
}

function drawNav() {
  navCtx.clearRect(0, 0, navCan.width, navCan.height);
  
  let ship = ships[0];
  let radius = 100;
  let centerX = 100;
  let centerY = 100;
  
  navCtx.beginPath();
  navCtx.moveTo(.5 + centerX, .5 + centerY);
  navCtx.lineWidth = 1;
  navCtx.lineTo(
      .5 + (Math.cos(radians(ship.heading)) * radius*.75 + centerX),
      .5 + (Math.sin(radians(ship.heading)) * radius*.75 + centerY)
  )
  navCtx.strokeStyle = '#00ff00';
  navCtx.stroke();

  navCtx.beginPath();
  navCtx.arc(radius + .5, radius + .5,
             radius-5, 0, 2 * Math.PI);
  navCtx.lineWidth = 2;
  navCtx.strokeStyle = '#ffffff';
  navCtx.stroke();
}
