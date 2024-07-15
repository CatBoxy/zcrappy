import { ScheduleState } from "../../../enums/ScheduleState";

export default class Schedule {
  public uuid;
  public productId;
  public userId;
  public cronExpression;
  public lastRun?;
  public created;
  public deleted?;
  public state;

  constructor(
    uuid: string,
    productId: string,
    userId: string,
    cronExpression: string,
    lastRun: Date | undefined,
    created: Date,
    deleted: Date | undefined,
    state: keyof typeof ScheduleState
  ) {
    this.uuid = uuid;
    this.productId = productId;
    this.userId = userId;
    this.cronExpression = cronExpression;
    this.lastRun = lastRun || null;
    this.created = created;
    this.deleted = deleted || null;
    this.state = state;
  }

  public getData(): Record<string, any> {
    return {
      uuid: this.uuid,
      productId: this.productId,
      userId: this.userId,
      cronExpression: this.cronExpression,
      lastRun: this.lastRun,
      created: this.created,
      deleted: this.deleted,
      state: this.state
    };
  }
}
