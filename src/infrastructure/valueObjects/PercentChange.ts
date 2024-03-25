import { ChangeDirection } from "../../enums/ChangeDirection";

export class PercentChange {
  private percentage: number;
  private changeDirection: keyof typeof ChangeDirection;

  constructor(amount: number) {
    this.percentage = Math.ceil(amount);
    this.changeDirection =
      this.percentage === 0
        ? ChangeDirection.Stable
        : this.percentage > 0
        ? ChangeDirection.Increase
        : ChangeDirection.Decrease;
  }

  public getPercentage(): number {
    return Math.abs(this.percentage);
  }

  public getChangeDirection(): string {
    return this.changeDirection;
  }
}
