import Database from "../persistence/db";
import { MLProductRepo } from "../interfaces/mlProduct/MLProductRepo";
import MLProduct from "../interfaces/mlProduct/MLProduct";

export default class MysqlMLProductRepoImpl implements MLProductRepo {
  private db: Database;
  private mainTable: string = "ml_products";
  private pricesTable: string = "ml_product_prices";

  constructor(db: Database) {
    this.db = db;
  }

  public initTransaction(): void {
    this.db.initTransaction();
  }

  public commitTransaction(): void {
    this.db.commit();
  }

  public rollbackTransaction(): void {
    this.db.rollback();
  }

  public addMLProduct(mlProduct: MLProduct): void {
    const mlProductData = mlProduct.getData();

    this.db.insert(this.mainTable, {
      id: mlProductData.id,
      name: mlProductData.name,
      url: mlProductData.url,
      created: mlProductData.created
    });
    this.db.insert(this.pricesTable, {
      ml_product_id: mlProductData.id,
      price: mlProductData.price
    });
  }
}
