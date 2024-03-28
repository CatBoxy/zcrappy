import MLProduct from "./MLProduct";
import { ScheduleState } from "../../../enums/ScheduleState";

export interface MLProductRow {
  id: string;
  name: string;
  url: string;
  created: Date;
  updated: Date;
  state?: keyof typeof ScheduleState;
  price?: number;
  previous_price?: number;
  previous_updated?: Date;
}

export interface MLProductRepo {
  initTransaction(): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;

  addMLProduct(mlProduct: MLProduct): Promise<void>;

  addMLProductPrice(mlProduct: MLProduct): Promise<void>;

  getProductWithUrl(url: string): Promise<MLProductRow>;

  productExists(url: string): Promise<boolean>;

  getProductUrlById(productId: string): Promise<string | null>;

  getAllProducts(): Promise<Array<MLProductRow>>;
}
