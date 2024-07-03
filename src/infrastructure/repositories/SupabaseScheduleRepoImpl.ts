import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { ScheduleRepo } from "../interfaces/schedule/ScheduleRepo";
import Schedule from "../interfaces/schedule/Schedule";

dotenv.config();

export default class SupabaseScheduleRepoImpl implements ScheduleRepo {
  private serviceKey: string = process.env.SERVICE_KEY!;
  private supabaseUrl: string = process.env.SUPABASE_URL!;
  private scheduleTable: string = "Scheduled_task";
  private supabase = createClient(this.supabaseUrl, this.serviceKey);

  public async addSchedule(schedule: Schedule): Promise<void> {
    try {
      const scheduleData = schedule.getData();
      const { error: scheduleError } = await this.supabase
        .from(this.scheduleTable)
        .upsert([
          {
            uuid: scheduleData.uuid,
            created_at: scheduleData.created,
            product_id: scheduleData.productId,
            cron_expression: scheduleData.cronExpression,
            state: scheduleData.state
          }
        ]);

      if (scheduleError) {
        throw new Error(`Error upserting schedule: ${scheduleError.message}`);
      }
    } catch (error: any) {
      throw new Error("Schedule repository error: " + error.message);
    }
  }

  public async updateLastRun(schedule: Schedule): Promise<void> {}

  // public async getAllSchedules(): Promise<Array<ScheduleRow>> {};
}
