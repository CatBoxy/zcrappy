import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import ZaraProductController from "../controllers/ZaraProductController";
// import ScheduleController from "../controllers/ScheduleController";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";
import SupabaseZaraProductRepoImpl from "../infrastructure/repositories/SupabaseProductRepoImpl";
import SupabaseScheduleRepoImpl from "../infrastructure/repositories/SupabaseScheduleRepoImpl";

const scrapingScript = process.env.SCRAPING_SCRIPT!;

const router = Router();

router.get("/zaraProduct", async (req: Request, res: Response) => {
  const zaraProductRepo = new SupabaseZaraProductRepoImpl();
  const scheduleRepo = new SupabaseScheduleRepoImpl();
  const zaraProductController = new ZaraProductController(
    zaraProductRepo,
    scheduleRepo
  );
  const filename = scrapingScript;
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

router.post("/link-telegram", async (req: Request, res: Response) => {
  console.log(req.body);
  const { token, userId } = req.body;
  const serviceKey: string = process.env.SERVICE_KEY!;
  const supabaseUrl: string = process.env.SUPABASE_URL!;
  const telegramTokenTable: string = "Telegram_token";
  const userTable: string = "User";
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: tokenData, error: tokenError } = await supabase
    .from(telegramTokenTable)
    .select("telegram_user_id")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return res.status(400).send({ message: "Token vencida o no existente." });
  }

  const telegramId = tokenData.telegram_user_id;

  const { data, error } = await supabase
    .from(userTable)
    .update({ telegram_id: telegramId })
    .eq("uuid", userId);

  if (error) {
    return res
      .status(500)
      .send({ message: "Error al enlazar cuenta de Telegram." });
  }

  await supabase.from(telegramTokenTable).delete().eq("token", token);

  res
    .status(200)
    .send({ message: "Cuenta de Telegram enlazada satisfactoriamente." });
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
  const filename = scrapingScript;
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
