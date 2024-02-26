import { v4 as uuidv4 } from "uuid";

import MLProduct from "../infrastructure/interfaces/mlProduct/MLProduct";
import { MLProductRepo } from "../infrastructure/interfaces/mlProduct/MLProductRepo";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";

interface MLProductController {
  run(filename: string, query: string): Promise<void>;
}

export default class MLProductControllerImpl implements MLProductController {
  private manager = new ScriptManagerImpl();
  private mlProductRepo: MLProductRepo;

  constructor(mlProductRepo: MLProductRepo) {
    this.mlProductRepo = mlProductRepo;
  }

  public async run(fileName: string, query?: string): Promise<void> {
    let results;
    if (query) {
      results = await this.manager.runScript(fileName, [query]);
    } else {
      results = await this.manager.runScript(fileName);
    }
    if (!results) {
      console.log("Failed to get script results");
      return;
    }

    const data = JSON.parse(results);
    const mlProduct = new MLProduct(
      uuidv4(),
      data.name,
      data.url,
      data.price,
      data.created
    );
    try {
      this.mlProductRepo.initTransaction;
      this.mlProductRepo.addMLProduct(mlProduct);
      this.mlProductRepo.commitTransaction();
    } catch (error: any) {
      console.error("Error saving MLProduct:", error.message);
      this.mlProductRepo.rollbackTransaction();
    }
  }
}
