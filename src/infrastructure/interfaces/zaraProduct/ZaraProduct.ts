import { ScheduleState } from "../../../enums/ScheduleState";

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

export default class ZaraProduct {
  public uuid;
  public name;
  public url;
  public created;
  // public state;
  public userUuid;
  public colors;
  public scheduleId;

  constructor(
    uuid: string,
    name: string | null | undefined,
    url: string,
    created: Date,
    // state: keyof typeof ScheduleState,
    userUuid: string,
    colors: Array<Color>,
    scheduleId: string
  ) {
    this.uuid = uuid;
    this.name = name;
    this.url = url;
    this.created = created;
    // this.state = state;
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
      // state: this.state,
      userUuid: this.userUuid,
      colors: this.colors,
      scheduleId: this.scheduleId
    };
  }
}
