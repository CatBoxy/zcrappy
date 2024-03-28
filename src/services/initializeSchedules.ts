import cron from "node-cron";

import Database from "../infrastructure/persistence/pgDb";
import MLProductControllerImpl from "../controllers/MLProductController";
import PostgresMLProductRepoImpl from "../infrastructure/repositories/PostgresMLProductRepoImpl";
import PostgresScheduleRepoImpl from "../infrastructure/repositories/PostgresScheduleRepoImpl";

export default async function initializeSchedules() {
  try {
    const db = await Database.getInstance();
    const mlProductRepo = new PostgresMLProductRepoImpl(db);
    const scheduleRepo = new PostgresScheduleRepoImpl(db);
    const rows = await scheduleRepo.getAllSchedules();

    if (rows.length === 0) {
      console.log(
        "initializeSchedules error: There are no schedules to initialize"
      );
      return;
    }

    rows.forEach((row) => {
      cron.schedule(row.cron_expression, async () => {
        const productUrl = await mlProductRepo.getProductUrlById(
          row.product_id
        );
        const mlProductController = new MLProductControllerImpl(mlProductRepo);
        if (productUrl) {
          await mlProductController.run("mLProduct.py", productUrl);
          console.log(
            `Scheduled execution for product ID ${row.product_id} completed.`
          );
        }
      });
    });

    console.log("Schedules re-initialized.");
  } catch (error: any) {
    throw new Error("initializeSchedules error: " + error.message);
  }
}
