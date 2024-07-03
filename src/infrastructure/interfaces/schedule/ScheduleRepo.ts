import Schedule from "./Schedule";

export interface ScheduleRow {
  id: string;
  product_id: string;
  cron_expression: string;
  last_run: Date;
}

export interface ScheduleRepo {
  addSchedule(schedule: Schedule): Promise<void>;

  updateLastRun(schedule: Schedule): Promise<void>;

  // getAllSchedules(): Promise<Array<ScheduleRow>>;
}
