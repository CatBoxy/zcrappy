export default class MLProduct {
  public id;
  public name;
  public url;
  public price;
  public created;

  constructor(
    id: string,
    name: string,
    url: string,
    price: string,
    created: Date
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.price = price;
    this.created = created;
  }

  public getData(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      price: this.price,
      created: this.created
    };
  }
}
