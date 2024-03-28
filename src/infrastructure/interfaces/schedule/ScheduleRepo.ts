import Schedule from "./Schedule";

export interface ScheduleRow {
  id: string;
  product_id: string;
  cron_expression: string;
  last_run: Date;
}

export interface ScheduleRepo {
  initTransaction(): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;

  addSchedule(schedule: Schedule): Promise<void>;

  updateLastRun(schedule: Schedule): Promise<void>;

  getAllSchedules(): Promise<Array<ScheduleRow>>;
}
