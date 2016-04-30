
namespace Bridgesim.Core {

  export class Projectile implements Tickable {
    body: Body;
    private velocity = .1;

    constructor(x: number, y: number, yaw: number) {
      this.body = new Body(x, y, yaw, 0);
    }

    tick() {
      let rads = radians(this.body.yaw - 90);
      this.body.setX(this.body.x + (this.velocity * Math.cos(rads)));
      this.body.setY(this.body.y + (this.velocity * Math.sin(rads)));
    }
  }
}
