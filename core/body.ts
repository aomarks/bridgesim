
namespace Bridgesim.Core {

  export class Body {
    private prevX: number;
    private prevY: number;
    private prevYaw: number;
    private prevRoll: number;

    constructor(public x: number, public y: number, public yaw: number,
                public roll: number) {
      this.prevX = x;
      this.prevY = y;
      this.prevYaw = yaw;
      this.prevRoll = roll;
    }

    setX(x: number): void {
      this.prevX = this.x;
      this.x = x;
    }

    setY(y: number): void {
      this.prevY = this.y;
      this.y = y;
    }

    setYaw(yaw: number): void {
      this.prevYaw = this.yaw;
      this.yaw = yaw;
    }

    setRoll(roll: number): void {
      this.prevRoll = this.roll;
      this.roll = roll;
    }

    lerpX(alpha: number): number {
      return this.prevX + (alpha * (this.x - this.prevX));
    }

    lerpY(alpha: number): number {
      return this.prevY + (alpha * (this.y - this.prevY));
    }

    lerpYaw(alpha: number): number {
      return this.prevYaw + (alpha * (this.yaw - this.prevYaw));
    }

    lerpRoll(alpha: number): number {
      return this.prevRoll + (alpha * (this.roll - this.prevRoll));
    }
  }
}
