import { RowDataPacket } from "mysql2/promise";
import MLProduct from "./MLProduct";

export interface MLProductRow extends RowDataPacket {
  id: string;
  name: string;
  url: string;
  created: Date;
  price?: string;
}

export interface MLProductRepo {
  initTransaction(): void;

  commitTransaction(): void;

  rollbackTransaction(): void;

  addMLProduct(mlProduct: MLProduct): void;

  addMLProductPrice(mlProduct: MLProduct): void;

  getProductWithUrl(url: string): Promise<MLProductRow>;

  productExists(url: string): Promise<boolean>;

  getProductUrlById(productId: string): Promise<string | null>;

  getAllProducts(): Promise<Array<MLProductRow>>;
}
