import { v4 as uuidv4 } from "uuid";

import ZaraProduct, {
  Color,
  Size,
} from "../infrastructure/interfaces/zaraProduct/ZaraProduct";
import { ZaraProductRepo } from "../infrastructure/interfaces/zaraProduct/ZaraProductRepo";
import ScriptManagerImpl from "../infrastructure/ScriptManagerImpl";
import { sendTelegramAlert } from "../services/telegramBotService";
import { StockState } from "../enums/StockState";

interface ZaraController {
  run(
    filename: string,
    userId: string,
    scheduleId: string,
    url: string
  ): Promise<void>;
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
  ): Promise<void> {
    let results = await this.manager.runScript(fileName, [url]);
    if (!results) {
      console.log("Failed to get script results");
      throw new Error(
        "ZaraProduct controller error: Failed to get script results"
      );
    }

    try {
      const data = JSON.parse(results);
      const arrivingProduct = this.buildZaraProduct(
        data,
        userId,
        scheduleId,
        url
      );
      const existingProduct = await this.zaraProductRepo.getProductDetails(
        userId,
        scheduleId
      );
      if (existingProduct) {
        if (!existingProduct.isEqual(arrivingProduct)) {
          console.log("Not equal:", existingProduct.getData().name);
          console.log(existingProduct.getData().url);

          const { updatedProduct, notifications } = this.updateExistingProduct(
            existingProduct,
            arrivingProduct
          );

          await this.zaraProductRepo.addOrUpdateZaraProduct(updatedProduct);
          if (notifications.length > 0) {
            const result = await sendTelegramAlert(
              userId,
              notifications.join("\n")
            );
            console.log("notifications", notifications);
            console.log("Success:", result);
          }
        }
      } else {
        await this.zaraProductRepo.addOrUpdateZaraProduct(arrivingProduct);
      }
    } catch (error: any) {
      console.error("Error executing transaction:", error.message);
      throw new Error("ZaraProduct controller error: " + error.message);
    }
  }

  private updateExistingProduct(
    existingProduct: ZaraProduct,
    arrivingProduct: ZaraProduct
  ): { updatedProduct: ZaraProduct; notifications: string[] } {
    const differences = existingProduct.getDifferences(arrivingProduct);
    console.log(JSON.stringify(differences, null, 2));
    const notifications: string[] = [];

    // Add new colors
    existingProduct.colors.push(...differences.newColors);

    // Update removed colors
    for (const removedColor of differences.removedColors) {
      const existingColor = existingProduct.colors.find(
        (c) => c.name === removedColor.name
      );
      if (existingColor) {
        existingColor.sizes.forEach((size) => {
          size.availability = StockState.Out_of_stock;
          size.restockConfirmationCount = 0;
        });
      }
    }

    // Update color differences
    for (const colorDiff of differences.colorDifferences) {
      const existingColor = existingProduct.colors.find(
        (c) => c.name === colorDiff.name
      );
      if (existingColor) {
        for (const sizeDiff of colorDiff.sizeDifferences) {
          const existingSize = existingColor.sizes.find(
            (s) => s.name === sizeDiff.name
          );
          if (existingSize) {
            if (sizeDiff.newAvailability === StockState.Out_of_stock) {
              existingSize.restockConfirmationCount = 0;
            } else if (
              existingSize.availability === StockState.Out_of_stock &&
              (sizeDiff.newAvailability === StockState.In_stock ||
                sizeDiff.newAvailability === StockState.Low_on_stock)
            ) {
              existingSize.restockConfirmationCount++;
            } else if (
              sizeDiff.newAvailability === StockState.In_stock ||
              sizeDiff.newAvailability === StockState.Low_on_stock
            ) {
              existingSize.restockConfirmationCount++;
            }

            if (existingSize.restockConfirmationCount >= 3) {
              notifications.push(
                `Nuevo stock confirmado para tu producto: ${
                  existingProduct.name
                }, para el talle: ${sizeDiff.name}, de color: ${
                  colorDiff.name
                }, stock: ${this.availability(
                  sizeDiff.newAvailability
                )}, precio: $${sizeDiff.newPrice}, url: ${existingProduct.url}`
              );
              existingSize.restockConfirmationCount = 0;
            }

            existingSize.availability = sizeDiff.newAvailability;
            existingSize.price = sizeDiff.newPrice;
            existingSize.oldPrice = sizeDiff.newOldPrice;
            existingSize.discountPercentage = sizeDiff.newDiscountPercentage;

            if (sizeDiff.oldPrice !== sizeDiff.newPrice) {
              notifications.push(`Cambio de precio para tu producto: ${existingProduct.name}, talle: ${sizeDiff.name}, color: ${colorDiff.name},
              precio anterior: ${sizeDiff.oldPrice}, nuevo precio: ${sizeDiff.newPrice}, url: ${existingProduct.url}`);
            }
          } else {
            const newSize = new Size(
              uuidv4(),
              sizeDiff.name,
              sizeDiff.newAvailability,
              new Date(),
              sizeDiff.newOldPrice,
              sizeDiff.newPrice,
              sizeDiff.newDiscountPercentage,
              existingColor.uuid,
              existingProduct.uuid
            );
            newSize.restockConfirmationCount = 1;
            existingColor.sizes.push(newSize);
          }
        }
      }
    }

    return { updatedProduct: existingProduct, notifications };
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

  private buildZaraProduct(
    data: any,
    userId: string,
    scheduleId: string,
    url: string
  ): ZaraProduct {
    const productUuid = uuidv4();
    return new ZaraProduct(
      productUuid,
      data.name ?? null,
      url ?? null,
      new Date(data.created) ?? null,
      userId ?? null,
      (data.colors ?? []).map((colorData: any) => {
        const colorUuid = uuidv4();
        return new Color(
          colorUuid,
          colorData.name ?? null,
          colorData.hexCode ?? null,
          new Date(colorData.created) ?? null,
          (colorData.sizes ?? []).map((sizeData: any) => {
            const sizeUuid = uuidv4();
            return new Size(
              sizeUuid,
              sizeData.name ?? null,
              sizeData.availability ?? null,
              new Date(sizeData.created) ?? null,
              sizeData.oldPrice ?? null,
              sizeData.price ?? null,
              sizeData.discountPercentage ?? null,
              colorUuid,
              productUuid,
              sizeData.restockConfirmationCount ?? 0
            );
          }),
          colorData.image ?? null,
          colorData.url ?? null,
          productUuid
        );
      }),
      scheduleId ?? null
    );
  }
}
