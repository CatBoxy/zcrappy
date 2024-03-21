import { ScheduleState } from "../../../enums/ScheduleState";
import { Money } from "../../valueObjects/Money";
import { PercentChange } from "../../valueObjects/PercentChange";

export default class MLProduct {
  public id;
  public name;
  public url;
  public created;
  public state;
  public percentChange: PercentChange;
  public changeDirection;
  public price?: Money;
  public updated?;

  constructor(
    id: string,
    name: string,
    url: string,
    created: Date,
    state: keyof typeof ScheduleState,
    percentChange: number,
    changeDirection: string,
    price?: string,
    updated?: Date
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.created = created;
    this.state = state;
    this.percentChange = new PercentChange(percentChange);
    this.changeDirection = changeDirection;
    this.price = price ? new Money(price) : undefined;
    this.updated = updated;
  }

  public getData(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      created: this.created,
      state: this.state,
      percentChange: this.percentChange.getPercentage(),
      changeDirection: this.changeDirection,
      price: this.price?.getAmount(),
      updated: this.updated
    };
  }
}
