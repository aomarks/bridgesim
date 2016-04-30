
namespace Bridgesim.Core {

  export class Projectile implements Tickable {
    private velocity = .1;
    constructor(public x: number, public y: number, public heading: number) {}

    tick() {
      let rads = radians(this.heading - 90);
      this.x += this.velocity * Math.cos(rads);
      this.y += this.velocity * Math.sin(rads);
    }
  }
}
