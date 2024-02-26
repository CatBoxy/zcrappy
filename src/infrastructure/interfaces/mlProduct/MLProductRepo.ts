import MLProduct from "./MLProduct";

export interface MLProductRepo {
  initTransaction(): void;

  commitTransaction(): void;

  rollbackTransaction(): void;

  addMLProduct(mlProduct: MLProduct): void;
}
