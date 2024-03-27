import { ScheduleState } from "../../../enums/ScheduleState";
// import { Money } from "../../valueObjects/Money";
import { PercentChange } from "../../valueObjects/PercentChange";

export default class MLProduct {
  public id;
  public name;
  public url;
  public created;
  public state;
  public previousPrice?: number;
  public price?: number;
  public updated?;

  constructor(
    id: string,
    name: string,
    url: string,
    created: Date,
    state: keyof typeof ScheduleState,
    previousPrice?: number,
    price?: number,
    updated?: Date
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.created = created;
    this.state = state;
    this.previousPrice = previousPrice ? previousPrice : undefined;
    this.price = price ? price : undefined;
    this.updated = updated;
  }

  public getData(): Record<string, any> {
    const percent = new PercentChange(this.price, this.previousPrice);
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      created: this.created,
      state: this.state,
      percentChange: percent.getPercentage(),
      changeDirection: percent.getChangeDirection(),
      price: this.price,
      updated: this.updated
    };
  }
}
