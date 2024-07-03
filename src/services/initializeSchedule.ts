import cron from "node-cron";

import ZaraProductControllerImpl from "../controllers/ZaraProductController";
import SupabaseZaraProductRepoImpl from "../infrastructure/repositories/SupabaseProductRepoImpl";
import SupabaseScheduleRepoImpl from "../infrastructure/repositories/SupabaseScheduleRepoImpl";

export default async function initializeSchedule(
  productId: string,
  cronExpression: string
) {
  try {
    const zaraProductRepo = new SupabaseZaraProductRepoImpl();
    const scheduleRepo = new SupabaseScheduleRepoImpl();
    const zaraProductController = new ZaraProductControllerImpl(
      zaraProductRepo,
      scheduleRepo
    );
    const productDetails = await zaraProductRepo.getProductDetailsById(
      productId
    );
    if (productDetails) {
      const product = productDetails.getData();
      console.log(
        `Initialization for product ID ${productId} schedule started.`
      );
      cron.schedule(cronExpression, async () => {
        await zaraProductController.run("zaraLocal.py", product.url);
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
