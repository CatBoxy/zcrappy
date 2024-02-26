import { Router, Request, Response } from "express";
import MLProductController from "../controllers/MLProductController";
import Database from "../infrastructure/persistence/db";
import MysqlMLProductRepoImpl from "../infrastructure/repositories/MysqlMLProductRepoImpl";

const router = Router();

router.get("/mlProduct", async (req: Request, res: Response) => {
  const db = new Database();
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

export default router;
