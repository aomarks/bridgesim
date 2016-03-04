///<reference path="input.ts" />
///<reference path="map.ts" />
///<reference path="nav.ts" />
///<reference path="power.ts" />
///<reference path="ship.ts" />
///<reference path="thrust.ts" />
///<reference path="util.ts" />
///<reference path="const.ts" />
///<reference path="global.ts" />

function init(): void {
  ships = [
    new Ship('P28', 30, 30, 0),
    new Ship('A19', 18, 2, 18),
    new Ship('S93', 20, 8, 37),
  ];
  ship = ships[0];
  shipIdx = 0;

  initInput();
  initMap();
  initNav();
  initThrust();
  initPower();

  requestAnimationFrame(function(ts: number) {
    requestAnimationFrame(frame);
    draw();
    prevTs = ts;
  });
}

let prevTs: number;
let lag: number = 0;

function frame(ts: number): void {
  requestAnimationFrame(frame);
  lag += ts - prevTs;
  while (lag >= TGT_MPF) {
    // TODO probably should be handling inputs only once per frame
    inputs();
    tick();
    lag -= TGT_MPF;
  }
  draw();
  prevTs = ts;
}

function tick(): void {
  for (let ship of ships) {
    ship.tick();
  }
}

function draw(): void {
  drawMap();
  drawNav();
  drawThrust();
  drawPower();
}
