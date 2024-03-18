import cron from "node-cron";

import MLProductControllerImpl from "../controllers/MLProductController";
import MysqlMLProductRepoImpl from "../infrastructure/repositories/MysqlMLProductRepoImpl";
import Database from "../infrastructure/persistence/db";

export default async function initializeSchedule(
  productId: string,
  cronExpression: string
) {
  try {
    const db = await Database.getInstance();
    const mlProductRepo = new MysqlMLProductRepoImpl(db);
    const mlProductController = new MLProductControllerImpl(mlProductRepo);
    const productUrl = await mlProductRepo.getProductUrlById(productId);

    if (productUrl) {
      console.log(
        `Initialization for product ID ${productId} schedule started.`
      );
      cron.schedule(cronExpression, async () => {
        await mlProductController.run("mLProduct.py", productUrl);
        console.log(
          `Scheduled execution for product ID ${productId} completed.`
        );
      });
    } else {
      console.log(
        `initializeSchedule error: couldn't initialize schedule for product ${productId}`
      );
      throw new Error(
        `initializeSchedule error: couldn't initialize schedule for product ${productId}`
      );
    }
  } catch (error: any) {
    throw new Error("initializeSchedule error: " + error.message);
  }
}
