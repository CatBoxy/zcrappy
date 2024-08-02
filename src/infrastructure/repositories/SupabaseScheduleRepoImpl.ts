import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { ScheduleRepo } from "../interfaces/schedule/ScheduleRepo";
import Schedule from "../interfaces/schedule/Schedule";
import { ScheduleState } from "../../enums/ScheduleState";

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
            user_id: scheduleData.userId,
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

  public async updateLastRun(uuid: string): Promise<void> {
    try {
      const { error: scheduleError } = await this.supabase
        .from(this.scheduleTable)
        .update({ last_run: new Date() })
        .eq("uuid", uuid);
    } catch (error: any) {
      throw new Error(`Error updating last_run: ${error.message}`);
    }
  }

  public async stopSchedule(uuid: string): Promise<void> {
    try {
      const { error: scheduleError } = await this.supabase
        .from(this.scheduleTable)
        .update({ state: ScheduleState.Stopped })
        .eq("uuid", uuid);
    } catch (error: any) {
      throw new Error(`Error stopping schedule: ${error.message}`);
    }
  }

  public async stopScheduleError(uuid: string): Promise<void> {
    try {
      const { error: scheduleError } = await this.supabase
        .from(this.scheduleTable)
        .update({ state: ScheduleState.Error })
        .eq("uuid", uuid);
    } catch (error: any) {
      throw new Error(`Error stopping with error schedule: ${error.message}`);
    }
  }

  // public async getAllSchedules(): Promise<Array<ScheduleRow>> {};
}
