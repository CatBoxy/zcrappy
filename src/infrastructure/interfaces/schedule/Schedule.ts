import { ScheduleState } from "../../../enums/ScheduleState";

export default class Schedule {
  public productId;
  public cronExpression;
  public lastRun?;
  public created;
  public deleted?;
  public state;

  constructor(
    productId: string,
    cronExpression: string,
    lastRun: Date | undefined,
    created: Date,
    deleted: Date | undefined,
    state: ScheduleState
  ) {
    this.productId = productId;
    this.cronExpression = cronExpression;
    this.lastRun = lastRun || null;
    this.created = created;
    this.deleted = deleted || null;
    this.state = state;
  }

  public getData(): Record<string, any> {
    return {
      productId: this.productId,
      cronExpression: this.cronExpression,
      lastRun: this.lastRun,
      created: this.created,
      deleted: this.deleted,
      state: this.state
    };
  }
}
