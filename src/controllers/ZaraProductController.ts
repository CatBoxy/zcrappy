import { v4 as uuidv4 } from "uuid";

import ZaraProduct, {
  Color,
  Size
} from "../infrastructure/interfaces/zaraProduct/ZaraProduct";
import { ZaraProductRepo } from "../infrastructure/interfaces/zaraProduct/ZaraProductRepo";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";
import { sendTelegramAlert } from "../services/telegramBotService";
import { StockState } from "../enums/StockState";

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
  run(
    filename: string,
    userId: string,
    scheduleId: string,
    url: string
  ): Promise<Record<string, string>>;
  handleAddOrUpdateZaraProduct(
    userUuid: string,
    productData: any,
    scheduleId: string,
    url: string
  ): Promise<ZaraProduct>;
}

export default class ZaraProductControllerImpl implements ZaraController {
  private manager = new ScriptManagerImpl();
  private zaraProductRepo: ZaraProductRepo;

  constructor(zaraProductRepo: ZaraProductRepo) {
    this.zaraProductRepo = zaraProductRepo;
  }

  public async run(
    fileName: string,
    userId: string,
    scheduleId: string,
    url: string
  ): Promise<Record<string, any>> {
    let results = await this.manager.runScript(fileName, [url]);
    if (!results) {
      console.log("Failed to get script results");
      throw new Error(
        "ZaraProduct controller error: Failed to get script results"
      );
    }

    try {
      const data = JSON.parse(results);
      const product = await this.handleAddOrUpdateZaraProduct(
        userId,
        data,
        scheduleId,
        url
      );
      return product.getData();
    } catch (error: any) {
      console.error("Error executing transaction:", error.message);
      throw new Error("ZaraProduct controller error: " + error.message);
    }
  }

  public async handleAddOrUpdateZaraProduct(
    userUuid: string,
    productData: any,
    scheduleId: string,
    url: string
  ): Promise<ZaraProduct> {
    const existingProduct = await this.zaraProductRepo.getProductDetails(
      userUuid,
      scheduleId
    );

    const arrivingProductColors: Set<string> = new Set(
      productData.colors.map((color: ColorData) => color.name)
    );

    if (existingProduct) {
      let availabilityChanges: string[] = [];
      let newSizes: string[] = [];

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
            newSizes.push(
              `Nuevo talle añadido: ${sizeData.name} para el producto: ${
                productData.name
              }, color: ${colorData.name}, stock: ${this.availability(
                sizeData.availability
              )}, url: ${url}`
            );
          } else {
            const isRestock =
              existingSize.availability === StockState.Out_of_stock &&
              sizeData.availability !== StockState.Out_of_stock;
            if (isRestock) {
              console.log(
                "existingSize.availability",
                existingSize.availability
              );
              console.log("sizeData.availability", sizeData.availability);
              availabilityChanges.push(
                `Nuevo stock para tu producto: ${
                  productData.name
                }, para el talle: ${sizeData.name}, de color: ${
                  colorData.name
                }, stock: ${this.availability(
                  sizeData.availability
                )}, url: ${url}`
              );
            }
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
            existingSize.availability = StockState.Out_of_stock;
          }
        }
      }

      await this.zaraProductRepo.addOrUpdateZaraProduct(existingProduct);

      if (newSizes.length > 0) {
        try {
          const result = await sendTelegramAlert(userUuid, newSizes.join("\n"));
          console.log("newSizes added", newSizes);
          console.log("Success:", result);
        } catch (error: any) {
          console.error("Error:", error.message);
        }
      }

      if (availabilityChanges.length > 0) {
        try {
          const result = await sendTelegramAlert(
            userUuid,
            availabilityChanges.join("\n")
          );
          console.log("availabilityChanges", availabilityChanges);
          console.log("Success:", result);
        } catch (error: any) {
          console.error("Error:", error.message);
        }
      }

      return existingProduct;
    } else {
      const productUuid = uuidv4();
      const newProduct = new ZaraProduct(
        productUuid,
        productData.name,
        url,
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
        }),
        scheduleId
      );

      await this.zaraProductRepo.addOrUpdateZaraProduct(newProduct);
      return newProduct;
    }
  }

  private availability(availability: string): string {
    switch (availability) {
      case StockState.Out_of_stock:
        return "Sin stock";
      case StockState.Low_on_stock:
        return "Bajo stock";
      case StockState.In_stock:
        return "En stock";
      default:
        throw new Error("availability error");
    }
  }
}
