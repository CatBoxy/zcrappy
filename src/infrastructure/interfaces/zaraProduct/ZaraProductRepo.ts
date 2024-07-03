import ZaraProduct from "./ZaraProduct";

export interface ZaraProductRepo {
  addZaraProduct(zaraProduct: ZaraProduct): Promise<void>;

  addOrUpdateZaraProduct(zaraProduct: ZaraProduct): Promise<void>;

  getProductDetails(
    userUuid: string,
    name: string
  ): Promise<ZaraProduct | null>;

  getProductDetailsById(productUuid: string): Promise<ZaraProduct | null>;
}
