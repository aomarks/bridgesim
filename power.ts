///<reference path="const.ts" />
///<reference path="global.ts" />
///<reference path="util.ts" />

let powerCan, powerCtx;

const PAD = 5;
const PAD2 = PAD * 2;
const BAR_W = 40;

function initPower() {
  powerCan = document.getElementById('power');
  powerCtx = powerCan.getContext('2d');
}

function drawPower() {
  const w = powerCan.width - 1;
  const h = powerCan.height - 1;
  powerCtx.clearRect(0, 0, w, h);

  powerCtx.strokeStyle = '#AAA';
  powerCtx.strokeRect(HP, HP, w, h);

  powerCtx.fillStyle = '#00F';
  for (let i = 0; i < ship.subsystems.length; i++) {
    let s = ship.subsystems[i];
    powerCtx.fillRect((i * BAR_W) + PAD + HP, h - PAD + HP, BAR_W - PAD,
                      snap(-((s.level / 100) * (h - PAD2))));
  }

  powerCtx.strokeStyle = '#F00';
  powerCtx.strokeRect((ship.curSubsystem * BAR_W) + PAD + HP, PAD + HP,
                      BAR_W - PAD, h - PAD2);
}
