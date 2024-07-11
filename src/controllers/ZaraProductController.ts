import { v4 as uuidv4 } from "uuid";

import ZaraProduct, {
  Color,
  Size
} from "../infrastructure/interfaces/zaraProduct/ZaraProduct";
import { ZaraProductRepo } from "../infrastructure/interfaces/zaraProduct/ZaraProductRepo";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";
import { ScheduleState } from "../enums/ScheduleState";
import { ScheduleRepo } from "../infrastructure/interfaces/schedule/ScheduleRepo";
import Schedule from "../infrastructure/interfaces/schedule/Schedule";

type SizeData = {
  name: string;
  availability: string;
  created: Date;
  oldPrice: number;
  price: number;
  discountPercentage: string;
};

type ColorData = {
  name: string;
  hexCode: string;
  created: Date;
  sizes: SizeData[];
  image: string;
  url: string;
};

interface ZaraController {
  run(filename: string, query: string): Promise<Record<string, string>>;
  handleAddOrUpdateZaraProduct(
    userUuid: string,
    productData: any
  ): Promise<ZaraProduct>;
}

export default class ZaraProductControllerImpl implements ZaraController {
  private manager = new ScriptManagerImpl();
  private zaraProductRepo: ZaraProductRepo;
  private scheduleRepo: ScheduleRepo;

  constructor(zaraProductRepo: ZaraProductRepo, scheduleRepo: ScheduleRepo) {
    this.zaraProductRepo = zaraProductRepo;
    this.scheduleRepo = scheduleRepo;
  }

  public async run(
    fileName: string,
    userId: string,
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
        "ZaraProduct controller error: Failed to get script results"
      );
    }
    const data = JSON.parse(results);

    try {
      const product = await this.handleAddOrUpdateZaraProduct(userId, data);
      return product.getData();
    } catch (error: any) {
      console.error("Error executing transaction:", error.message);
      throw new Error("ZaraProduct controller error: " + error.message);
    }
  }

  public async handleAddOrUpdateZaraProduct(
    userUuid: string,
    productData: any
  ): Promise<ZaraProduct> {
    const existingProduct = await this.zaraProductRepo.getProductDetails(
      userUuid,
      productData.name
    );

    const arrivingProductColors: Set<string> = new Set(
      productData.colors.map((color: ColorData) => color.name)
    );

    if (existingProduct) {
      for (const colorData of productData.colors) {
        let existingColor = existingProduct.colors.find(
          (color) => color.name === colorData.name
        );

        if (!existingColor) {
          existingColor = new Color(
            uuidv4(),
            colorData.name,
            colorData.hexCode,
            colorData.created,
            [],
            colorData.image,
            colorData.url,
            existingProduct.uuid
          );
          existingProduct.colors.push(existingColor);
        }

        for (const sizeData of colorData.sizes) {
          let existingSize = existingColor.sizes.find(
            (size) => size.name === sizeData.name
          );

          if (!existingSize) {
            existingSize = new Size(
              uuidv4(),
              sizeData.name,
              sizeData.availability,
              colorData.created,
              sizeData.oldPrice,
              sizeData.price,
              sizeData.discountPercentage,
              existingColor.uuid,
              existingProduct.uuid
            );
            existingColor.sizes.push(existingSize);
          } else {
            existingSize.availability = sizeData.availability;
            existingSize.oldPrice = sizeData.oldPrice;
            existingSize.price = sizeData.price;
            existingSize.discountPercentage = sizeData.discountPercentage;
          }
        }
      }
      for (const existingColor of existingProduct.colors) {
        if (!arrivingProductColors.has(existingColor.name)) {
          for (const existingSize of existingColor.sizes) {
            existingSize.availability = "out_of_stock";
          }
        }
      }

      await this.zaraProductRepo.addOrUpdateZaraProduct(existingProduct);
      return existingProduct;
    } else {
      const productUuid = uuidv4();
      const newProduct = new ZaraProduct(
        productUuid,
        productData.name,
        productData.colors[0].url,
        productData.created,
        userUuid,
        productData.colors.map((colorData: ColorData) => {
          const colorUuid = uuidv4();
          return new Color(
            colorUuid,
            colorData.name,
            colorData.hexCode,
            colorData.created,
            colorData.sizes.map((sizeData: SizeData) => {
              const sizeUuid = uuidv4();
              return new Size(
                sizeUuid,
                sizeData.name,
                sizeData.availability,
                sizeData.created,
                sizeData.oldPrice,
                sizeData.price,
                sizeData.discountPercentage,
                colorUuid,
                productUuid
              );
            }),
            colorData.image,
            colorData.url,
            productUuid
          );
        })
      );

      await this.zaraProductRepo.addOrUpdateZaraProduct(newProduct);
      const cronExpression = "0 0 * * *";
      const schedule = new Schedule(
        uuidv4(),
        productUuid,
        cronExpression,
        undefined,
        new Date(),
        undefined,
        ScheduleState.Playing
      );
      this.scheduleRepo.addSchedule(schedule);
      return newProduct;
    }
  }
}
