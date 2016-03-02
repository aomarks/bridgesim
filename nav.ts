///<reference path="util.ts" />
///<reference path="global.ts" />

let navCan: HTMLCanvasElement;
let navCtx: CanvasRenderingContext2D;

function initNav(): void {
  navCan = <HTMLCanvasElement>document.getElementById('nav');
  navCtx = navCan.getContext('2d');
}

function drawNav(): void {
  let w = navCan.width;
  let h = navCan.height;
  navCtx.clearRect(0, 0, w, h);

  navCtx.beginPath();
  navCtx.arc(w / 2 + HP, w / 2 + HP, w / 2 - 5, 0, 2 * Math.PI);
  navCtx.fillStyle = '#333';
  navCtx.fill();
  navCtx.strokeStyle = '#555';
  navCtx.stroke();

  let angle = radians(ship.heading - 90);
  navCtx.beginPath();
  navCtx.moveTo(w / 2 + HP, w / 2 + HP);
  navCtx.lineTo(Math.cos(angle) * (w / 2 - 8) + w / 2 + HP,
                Math.sin(angle) * (w / 2 - 8) + w / 2 + HP);
  navCtx.strokeStyle = '#ff0000';
  navCtx.lineWidth = 2;
  navCtx.stroke();
}
