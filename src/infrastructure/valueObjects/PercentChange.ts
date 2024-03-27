import { ChangeDirection } from "../../enums/ChangeDirection";

export class PercentChange {
  private percentage: number;
  private changeDirection: keyof typeof ChangeDirection;

  constructor(price?: number, previousPrice?: number) {
    this.percentage =
      price && previousPrice ? this.calcPercent(price, previousPrice) : 0;
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

  private calcPercent(price: number, previousPrice: number): number {
    const percent = ((price - previousPrice) / previousPrice) * 100;
    const rounded = Math.ceil(percent * Math.pow(10, 2)) / Math.pow(10, 2);
    return rounded;
  }
}
