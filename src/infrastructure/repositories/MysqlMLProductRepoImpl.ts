import Database from "../persistence/db";
import {
  MLProductRepo,
  MLProductRow
} from "../interfaces/mlProduct/MLProductRepo";
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
      price: mlProductData.price,
      created: mlProductData.created
    });
  }

  public addMLProductPrice(mlProduct: MLProduct): void {
    const mlProductData = mlProduct.getData();

    this.db.insert(this.pricesTable, {
      ml_product_id: mlProductData.id,
      price: mlProductData.price,
      created: mlProductData.created
    });
  }

  public async getProductWithUrl(url: string): Promise<MLProductRow> {
    const query = `SELECT id, name, url, created FROM ${this.mainTable} WHERE url = ?`;
    const product = (await this.db.result(query, [url])) as any;
    return product[0];
  }

  public async productExists(url: string): Promise<boolean> {
    const query = `SELECT COUNT(*) as count FROM ${this.mainTable} WHERE url = ?`;
    const rows = (await this.db.result(query, [url])) as any;
    return rows[0].count > 0;
  }
}
