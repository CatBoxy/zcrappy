import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";

import zaraRouter from "./routes/zaraRouter";
// import initializeSchedules from "./services/initializeSchedules";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
// const origin = process.env.ORIGIN;

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/api", zaraRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// initializeSchedules();
