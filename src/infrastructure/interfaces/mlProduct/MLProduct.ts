import { ScheduleState } from "../../../enums/ScheduleState";

export default class MLProduct {
  public id;
  public name;
  public url;
  public created;
  public state;
  public percentChange;
  public changeDirection;
  public price?;
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
    this.percentChange = percentChange;
    this.changeDirection = changeDirection;
    this.price = price;
    this.updated = updated;
  }

  public getData(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      created: this.created,
      state: this.state,
      percentChange: this.percentChange,
      changeDirection: this.changeDirection,
      price: this.price,
      updated: this.updated
    };
  }
}
