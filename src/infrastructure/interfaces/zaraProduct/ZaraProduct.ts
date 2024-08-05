import { StockState } from "../../../enums/StockState";

export type SizeData = {
  uuid: string;
  name: string;
  availability: string;
  created: Date;
  oldPrice: number;
  price: number;
  discountPercentage: string;
  colorId: string;
  productId: string;
};

export type ColorData = {
  uuid: string;
  name: string;
  hexCode: string;
  created: Date;
  sizes: SizeData[];
  image: string;
  url: string;
  productId: string;
};

export class Color {
  public uuid;
  public name;
  public hexCode;
  public created;
  public sizes;
  public image;
  public url;
  public productId;

  constructor(
    uuid: string,
    name: string,
    hexCode: string,
    created: Date,
    sizes: Array<Size>,
    image: string,
    url: string,
    productId: string
  ) {
    this.uuid = uuid;
    this.name = name;
    this.hexCode = hexCode;
    this.created = created;
    this.sizes = sizes;
    this.image = image;
    this.url = url;
    this.productId = productId;
  }

  public getData(): Record<string, any> {
    return {
      uuid: this.uuid,
      name: this.name,
      hexCode: this.hexCode,
      created: this.created,
      sizes: this.sizes,
      image: this.image,
      url: this.url,
      productId: this.productId
    };
  }
}

export class Size {
  public uuid;
  public name;
  public availability;
  public created;
  public oldPrice;
  public price;
  public discountPercentage;
  public colorId: string;
  public productId: string;

  constructor(
    uuid: string,
    name: string,
    availability: string,
    created: Date,
    oldPrice: number,
    price: number,
    discountPercentage: string,
    colorId: string,
    productId: string
  ) {
    this.uuid = uuid;
    this.name = name;
    this.availability = availability;
    this.created = created;
    this.oldPrice = oldPrice;
    this.price = price;
    this.discountPercentage = discountPercentage;
    this.colorId = colorId;
    this.productId = productId;
  }
}

interface SizeDifference {
  name: string;
  oldAvailability: string;
  newAvailability: string;
  oldPrice: number;
  newPrice: number;
  oldOldPrice: number;
  newOldPrice: number;
  oldDiscountPercentage: string;
  newDiscountPercentage: string;
}

interface ColorDifference {
  name: string;
  isNew: boolean;
  sizeDifferences: SizeDifference[];
}

interface ProductDifferences {
  newColors: Color[];
  removedColors: Color[];
  colorDifferences: ColorDifference[];
}

export default class ZaraProduct {
  public uuid;
  public name;
  public url;
  public created;
  public userUuid;
  public colors;
  public scheduleId;

  constructor(
    uuid: string,
    name: string | null | undefined,
    url: string,
    created: Date,
    userUuid: string,
    colors: Array<Color>,
    scheduleId: string
  ) {
    this.uuid = uuid;
    this.name = name;
    this.url = url;
    this.created = created;
    this.userUuid = userUuid;
    this.colors = colors;
    this.scheduleId = scheduleId;
  }

  public getData(): Record<string, any> {
    return {
      uuid: this.uuid,
      name: this.name,
      url: this.url,
      created: this.created,
      userUuid: this.userUuid,
      colors: this.colors,
      scheduleId: this.scheduleId
    };
  }

  public isEqual(other: ZaraProduct): boolean {
    if (this.colors.length !== other.colors.length) return false;
    for (let i = 0; i < this.colors.length; i++) {
      const thisColor = this.colors[i];
      const otherColor = other.colors.find((c) => c.name === thisColor.name);
      if (!otherColor) return false;
      if (thisColor.sizes.length !== otherColor.sizes.length) return false;
      for (let j = 0; j < thisColor.sizes.length; j++) {
        const thisSize = thisColor.sizes[j];
        const otherSize = otherColor.sizes.find(
          (s) => s.name === thisSize.name
        );
        if (!otherSize) return false;
        if (
          thisSize.availability !== otherSize.availability ||
          thisSize.price !== otherSize.price ||
          thisSize.oldPrice !== otherSize.oldPrice ||
          thisSize.discountPercentage !== otherSize.discountPercentage
        ) {
          return false;
        }
      }
    }
    return true;
  }

  public getDifferences(other: ZaraProduct): ProductDifferences {
    const differences: ProductDifferences = {
      newColors: [],
      removedColors: [],
      colorDifferences: []
    };

    const thisColorNames = new Set(this.colors.map((c) => c.name));
    const otherColorNames = new Set(other.colors.map((c) => c.name));

    differences.newColors = other.colors.filter(
      (c) => !thisColorNames.has(c.name)
    );
    differences.removedColors = this.colors.filter(
      (c) => !otherColorNames.has(c.name)
    );

    for (const thisColor of this.colors) {
      const otherColor = other.colors.find((c) => c.name === thisColor.name);
      if (otherColor) {
        const colorDiff: ColorDifference = {
          name: thisColor.name,
          isNew: false,
          sizeDifferences: []
        };

        for (const thisSize of thisColor.sizes) {
          const otherSize = otherColor.sizes.find(
            (s) => s.name === thisSize.name
          );
          if (
            otherSize &&
            (thisSize.availability !== otherSize.availability ||
              thisSize.price !== otherSize.price ||
              thisSize.oldPrice !== otherSize.oldPrice ||
              thisSize.discountPercentage !== otherSize.discountPercentage)
          ) {
            colorDiff.sizeDifferences.push({
              name: thisSize.name,
              oldAvailability: thisSize.availability,
              newAvailability: otherSize.availability,
              oldPrice: thisSize.price,
              newPrice: otherSize.price,
              oldOldPrice: thisSize.oldPrice,
              newOldPrice: otherSize.oldPrice,
              oldDiscountPercentage: thisSize.discountPercentage,
              newDiscountPercentage: otherSize.discountPercentage
            });
          } else if (!otherSize) {
            colorDiff.sizeDifferences.push({
              name: thisSize.name,
              oldAvailability: thisSize.availability,
              newAvailability: StockState.Out_of_stock,
              oldPrice: thisSize.price,
              newPrice: 0,
              oldOldPrice: thisSize.oldPrice,
              newOldPrice: 0,
              oldDiscountPercentage: thisSize.discountPercentage,
              newDiscountPercentage: "0%"
            });
          }
        }

        for (const otherSize of otherColor.sizes) {
          if (!thisColor.sizes.find((s) => s.name === otherSize.name)) {
            colorDiff.sizeDifferences.push({
              name: otherSize.name,
              oldAvailability: StockState.Out_of_stock,
              newAvailability: otherSize.availability,
              oldPrice: 0,
              newPrice: otherSize.price,
              oldOldPrice: 0,
              newOldPrice: otherSize.oldPrice,
              oldDiscountPercentage: "0%",
              newDiscountPercentage: otherSize.discountPercentage
            });
          }
        }

        if (colorDiff.sizeDifferences.length > 0) {
          differences.colorDifferences.push(colorDiff);
        }
      }
    }

    return differences;
  }
}
