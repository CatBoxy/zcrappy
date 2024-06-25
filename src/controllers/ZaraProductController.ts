import { v4 as uuidv4 } from "uuid";

import MLProduct from "../infrastructure/interfaces/mlProduct/MLProduct";
import { MLProductRepo } from "../infrastructure/interfaces/mlProduct/MLProductRepo";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";
import { ScheduleState } from "../enums/ScheduleState";

interface ZaraController {
  run(filename: string, query: string): Promise<Record<string, string>>;
  getAll(): Promise<Array<MLProduct>>;
  getAllData(): Promise<Record<string, any>[]>;
}

export default class ZaraProductControllerImpl implements ZaraController {
  private manager = new ScriptManagerImpl();
  private mlProductRepo: MLProductRepo;

  constructor(mlProductRepo: MLProductRepo) {
    this.mlProductRepo = mlProductRepo;
  }

  public async run(
    fileName: string,
    query?: string
  ): Promise<Record<string, any>> {
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
    // console.log(results);
    return {};
    // const data = JSON.parse(results);
    // const exists = await this.mlProductRepo.productExists(data.url);

    // try {
    //   await this.mlProductRepo.initTransaction();

    //   if (!exists) {
    //     const mlProduct = new MLProduct(
    //       uuidv4(),
    //       data.name,
    //       data.url,
    //       data.created,
    //       ScheduleState.Stopped,
    //       undefined,
    //       data.price,
    //       undefined
    //     );
    //     await this.mlProductRepo.addMLProduct(mlProduct);
    //     await this.mlProductRepo.commitTransaction();

    //     return mlProduct.getData();
    //   } else {
    //     const product = await this.mlProductRepo.getProductWithUrl(data.url);
    //     const mlProduct = new MLProduct(
    //       product.id,
    //       data.name,
    //       data.url,
    //       data.created,
    //       ScheduleState.Stopped,
    //       undefined,
    //       data.price,
    //       undefined
    //     );
    //     await this.mlProductRepo.addMLProductPrice(mlProduct);
    //     await this.mlProductRepo.commitTransaction();

    //     return mlProduct.getData();
    //   }
    // } catch (error: any) {
    //   this.mlProductRepo.rollbackTransaction();
    //   console.error("Error executing transaction:", error.message);
    //   throw new Error("MLProduct controller error: " + error.message);
    // }
  }

  public async getAll(): Promise<Array<MLProduct>> {
    try {
      const productRows = await this.mlProductRepo.getAllProducts();
      const products = productRows.map((row) => {
        const state = row.state ? row.state : ScheduleState.Stopped;
        return new MLProduct(
          row.id,
          row.name,
          row.url,
          row.created,
          state,
          row.previous_price,
          row.price,
          row.updated
        );
      });
      return products;
    } catch (error: any) {
      console.error("Error getting MLProducts:", error.message);
      throw new Error("MLProduct controller error: " + error.message);
    }
  }

  public async getAllData(): Promise<Record<string, any>[]> {
    try {
      const products = await this.getAll();
      const productData = products.map((product) => {
        return product.getData();
      });

      return productData;
    } catch (error: any) {
      console.error("Error getting MLProducts data:", error.message);
      throw new Error("MLProduct controller error: " + error.message);
    }
  }
}
