export class PercentChange {
  private percentage: number;

  constructor(amount: number) {
    this.percentage = Math.ceil(amount);
  }

  public getPercentage(): number {
    return this.percentage;
  }
}
