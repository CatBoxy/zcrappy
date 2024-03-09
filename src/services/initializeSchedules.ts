import cron from "node-cron";

import Database from "../infrastructure/persistence/db";
import MysqlMLProductRepoImpl from "../infrastructure/repositories/MysqlMLProductRepoImpl";
import MysqlScheduleRepoImpl from "../infrastructure/repositories/MysqlScheduleRepoImpl";
import MLProductControllerImpl from "../controllers/MLProductController";

export default async function initializeSchedules() {
  const db = await Database.getInstance();
  const mlProductRepo = new MysqlMLProductRepoImpl(db);
  const scheduleRepo = new MysqlScheduleRepoImpl(db);
  const rows = await scheduleRepo.getAllSchedules();

  if (rows.length === 0) {
    console.log("There are no schedules to initialize");
    return;
  }

  rows.forEach((row) => {
    cron.schedule(row.cron_expression, async () => {
      const productUrl = await mlProductRepo.getProductUrlById(row.product_id);
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
}
