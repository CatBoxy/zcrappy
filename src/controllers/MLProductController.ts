import { v4 as uuidv4 } from "uuid";

import MLProduct from "../infrastructure/interfaces/mlProduct/MLProduct";
import { MLProductRepo } from "../infrastructure/interfaces/mlProduct/MLProductRepo";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";

interface MLProductController {
  run(filename: string, query: string): Promise<void>;
  getAll(): Promise<Array<MLProduct>>;
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
      throw new Error(
        "MLProduct controller error: Failed to get script results"
      );
    }

    const data = JSON.parse(results);
    const exists = await this.mlProductRepo.productExists(data.url);

    if (!exists) {
      try {
        const mlProduct = new MLProduct(
          uuidv4(),
          data.name,
          data.url,
          data.created,
          data.price
        );

        this.mlProductRepo.initTransaction;
        await this.mlProductRepo.addMLProduct(mlProduct);
        this.mlProductRepo.commitTransaction();
      } catch (error: any) {
        console.error("Error saving MLProduct:", error.message);
        this.mlProductRepo.rollbackTransaction();
        throw new Error("MLProduct controller error: " + error.message);
      }
    } else {
      try {
        const product = await this.mlProductRepo.getProductWithUrl(data.url);
        const mlProduct = new MLProduct(
          product.id,
          data.name,
          data.url,
          data.created,
          data.price
        );

        this.mlProductRepo.initTransaction;
        this.mlProductRepo.addMLProductPrice(mlProduct);
        this.mlProductRepo.commitTransaction();
      } catch (error: any) {
        console.error("Error saving MLProduct:", error.message);
        this.mlProductRepo.rollbackTransaction();
        throw new Error("MLProduct controller error: " + error.message);
      }
    }
  }

  public async getAll(): Promise<Array<MLProduct>> {
    try {
      const productRows = await this.mlProductRepo.getAllProducts();
      const products = productRows.map((row) => {
        return new MLProduct(row.id, row.name, row.url, row.created, row.price);
      });

      return products;
    } catch (error: any) {
      console.error("Error getting MLProducts:", error.message);
      throw new Error("MLProduct controller error: " + error.message);
    }
  }
}
