import {
  createClient,
  SupabaseClient,
  PostgrestResponse
} from "@supabase/supabase-js";
import dotenv from "dotenv";
import cron, { ScheduledTask } from "node-cron";
import SupabaseZaraProductRepoImpl from "../infrastructure/repositories/SupabaseProductRepoImpl";
import SupabaseScheduleRepoImpl from "../infrastructure/repositories/SupabaseScheduleRepoImpl";
import ZaraProductControllerImpl from "../controllers/ZaraProductController";
import { ScheduleState } from "../enums/ScheduleState";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SERVICE_KEY!;
const SUPABASE_ANON_KEY = process.env.ANON_KEY!;
const scrapingScript = process.env.SCRAPING_SCRIPT!;
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ScheduledTaskEntry {
  uuid: string;
  created_at: string;
  deleted_at: string | null;
  product_id: string;
  user_id: string;
  cron_expression: string;
  last_run: string | null;
  state: keyof typeof ScheduleState;
}

let cronJobs: { [key: string]: ScheduledTask } = {};

const scheduleRepo = new SupabaseScheduleRepoImpl();
const zaraProductRepo = new SupabaseZaraProductRepoImpl();
const zaraProductController = new ZaraProductControllerImpl(
  zaraProductRepo,
  scheduleRepo
);

const setupRealtime = async (): Promise<void> => {
  try {
    const channelA = client
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public"
        },
        handleScheduleChange
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public"
        },
        handleScheduleChange
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public"
        },
        handleScheduleDelete
      )
      .subscribe();

    const { data: schedules, error }: PostgrestResponse<ScheduledTaskEntry> =
      await supabase.from("Scheduled_task").select("*").eq("state", "Playing");

    if (error) {
      throw new Error("Error fetching initial schedules: " + error.message);
    }

    schedules?.forEach((schedule: ScheduledTaskEntry) => {
      createOrUpdateCronJob(schedule);
    });
  } catch (error) {
    console.error("Error setting up realtime subscription:", error);
  }
};

const handleScheduleChange = (payload: any): void => {
  try {
    const schedule: ScheduledTaskEntry = payload.new;

    createOrUpdateCronJob(schedule);
  } catch (error) {
    console.error("Error handling schedule change:", error);
  }
};

const handleScheduleDelete = (payload: any): void => {
  try {
    deleteCronJob(payload.old.uuid);
  } catch (error) {
    console.error("Error handling schedule change:", error);
  }
};

const createOrUpdateCronJob = (schedule: ScheduledTaskEntry): void => {
  try {
    const { uuid, cron_expression, state, product_id, user_id } = schedule;

    if (state === "Playing") {
      if (cronJobs[uuid]) {
        cronJobs[uuid].stop();
      }

      cronJobs[uuid] = cron.schedule(cron_expression, async () => {
        try {
          const productDetails = await zaraProductRepo.getProductDetailsById(
            product_id
          );
          if (productDetails) {
            const productData = productDetails.getData();
            await zaraProductController.run(
              scrapingScript,
              user_id,
              productData.url
            );
          }
        } catch (error) {
          console.error(`Error executing job for schedule ID: ${uuid}`, error);
        }
      });
    } else {
      deleteCronJob(uuid);
    }
  } catch (error) {
    console.error("Error creating or updating cron job:", error);
  }
};

const deleteCronJob = (uuid: string): void => {
  try {
    if (cronJobs[uuid]) {
      cronJobs[uuid].stop();
      delete cronJobs[uuid];
    }
  } catch (error) {
    console.error("Error deleting cron job:", error);
  }
};

export { setupRealtime, createOrUpdateCronJob, deleteCronJob };
