import { RowDataPacket } from "mysql2/promise";
import Schedule from "./Schedule";

export interface ScheduleRow extends RowDataPacket {
  id: string;
  product_id: string;
  cron_expression: string;
  last_run: Date;
}

export interface ScheduleRepo {
  initTransaction(): void;

  commitTransaction(): void;

  rollbackTransaction(): void;

  addSchedule(schedule: Schedule): void;

  updateLastRun(schedule: Schedule): void;

  getAllSchedules(): Promise<Array<ScheduleRow>>;
}
