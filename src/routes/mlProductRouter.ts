import { Router, Request, Response } from "express";
import MLProductController from "../controllers/MLProductController";
import Database from "../infrastructure/persistence/db";
import MysqlMLProductRepoImpl from "../infrastructure/repositories/MysqlMLProductRepoImpl";
import MysqlScheduleRepoImpl from "../infrastructure/repositories/MysqlScheduleRepoImpl";
import ScheduleController from "../controllers/ScheduleController";

const router = Router();

router.get("/mlProduct", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const mlProductRepo = new MysqlMLProductRepoImpl(db);
  const mlProductController = new MLProductController(mlProductRepo);
  const filename = "mLProduct.py";
  try {
    const { url } = req.query;

    if (typeof url === "string") {
      await mlProductController.run(filename, url);
    } else {
      await mlProductController.run(filename);
    }
    res.json({ message: "Script executed successfully" });
  } catch (error) {
    console.error("Error executing script:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/mlProducts", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const mlProductRepo = new MysqlMLProductRepoImpl(db);
  const mlProductController = new MLProductController(mlProductRepo);
  try {
    const products = await mlProductController.getAllData();

    res.json(products);
  } catch (error) {
    console.error("Error getting all products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/schedule/:productId", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const scheduleRepo = new MysqlScheduleRepoImpl(db);
  const scheduleController = new ScheduleController(scheduleRepo);
  try {
    const { productId } = req.params;

    await scheduleController.schedule(productId);
    res.json({
      message: `Scheduled daily updates for product ID ${productId}`
    });
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
