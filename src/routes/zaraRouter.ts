import { Router, Request, Response } from "express";
import ZaraProductController from "../controllers/ZaraProductController";
import ScheduleController from "../controllers/ScheduleController";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";
import SupabaseZaraProductRepoImpl from "../infrastructure/repositories/SupabaseProductRepoImpl";
import SupabaseScheduleRepoImpl from "../infrastructure/repositories/SupabaseScheduleRepoImpl";

const router = Router();

router.get("/zaraProduct", async (req: Request, res: Response) => {
  const zaraProductRepo = new SupabaseZaraProductRepoImpl();
  const scheduleRepo = new SupabaseScheduleRepoImpl();
  const zaraProductController = new ZaraProductController(
    zaraProductRepo,
    scheduleRepo
  );
  const filename = "zaraLocal.py";
  try {
    const { url, user } = req.query as { url: string; user: string };
    console.log(user);
    let product;
    if (url && user) {
      product = await zaraProductController.run(filename, user, url);
    } else {
      product = await zaraProductController.run(filename, user);
    }
    res.json({ message: "Product added successfully", product: product.name });
  } catch (error) {
    console.error("Error executing script:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.get("/zaraProducts", async (req: Request, res: Response) => {
//   const db = await Database.getInstance();
//   const zaraProductRepo = new PostgresMLProductRepoImpl(db);
//   const zaraProductController = new ZaraProductController(zaraProductRepo);
//   try {
//     const products = await zaraProductController.getAllData();

//     res.json(products);
//   } catch (error) {
//     console.error("Error getting all products:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.get("/schedule/:productId", async (req: Request, res: Response) => {
//   const db = await Database.getInstance();
//   const scheduleRepo = new PostgresScheduleRepoImpl(db);
//   const scheduleController = new ScheduleController(scheduleRepo);
//   try {
//     const { productId } = req.params;

//     await scheduleController.schedule(productId);
//     res.json({
//       message: `Scheduled daily updates for product ID ${productId}`
//     });
//   } catch (error) {
//     console.error("Error saving schedule:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// FOR TESTING
router.get("/zaraProductTest", async (req: Request, res: Response) => {
  const filename = "zaraLocal.py";
  const { url } = req.query;
  const manager = new ScriptManagerImpl();
  let results;
  if (typeof url === "string") {
    results = await manager.runScript(filename, [url]);
  } else {
    results = await manager.runScript(filename);
  }
  if (!results) {
    console.log("Failed to get script results");
    throw new Error("MLProduct controller error: Failed to get script results");
  }
  return res.json(JSON.parse(results));
});

export default router;
