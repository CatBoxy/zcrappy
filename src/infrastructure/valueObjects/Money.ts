export class Money {
  private amount: string;

  constructor(amount: string) {
    this.amount = this.sanitizeAmount(amount);
  }

  private sanitizeAmount(amount: string): string {
    return amount.replace(/\./g, "");
  }

  public getAmount(): string {
    return this.amount;
  }
}
