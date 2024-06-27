import { Router, Request, Response } from "express";
import ZaraProductController from "../controllers/ZaraProductController";
import Database from "../infrastructure/persistence/pgDb";
import ScheduleController from "../controllers/ScheduleController";
import PostgresMLProductRepoImpl from "../infrastructure/repositories/PostgresMLProductRepoImpl";
import PostgresScheduleRepoImpl from "../infrastructure/repositories/PostgresScheduleRepoImpl";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";

const router = Router();

router.get("/zaraProduct", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const zaraProductRepo = new PostgresMLProductRepoImpl(db);
  const zaraProductController = new ZaraProductController(zaraProductRepo);
  const filename = "zara.py";
  try {
    const { url } = req.query;
    let product;
    if (typeof url === "string") {
      product = await zaraProductController.run(filename, url);
    } else {
      product = await zaraProductController.run(filename);
    }
    res.json({ message: "Product added successfully", name: product.name });
  } catch (error) {
    console.error("Error executing script:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/zaraProducts", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const zaraProductRepo = new PostgresMLProductRepoImpl(db);
  const zaraProductController = new ZaraProductController(zaraProductRepo);
  try {
    const products = await zaraProductController.getAllData();

    res.json(products);
  } catch (error) {
    console.error("Error getting all products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/schedule/:productId", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const scheduleRepo = new PostgresScheduleRepoImpl(db);
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

router.get("/zaraProductTest", async (req: Request, res: Response) => {
  const filename = "zara.py";
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
