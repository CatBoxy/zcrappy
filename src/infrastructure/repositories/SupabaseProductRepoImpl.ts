import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ZaraProduct, {
  Color,
  Size,
  ColorData,
  SizeData
} from "../interfaces/zaraProduct/ZaraProduct";
import { ZaraProductRepo } from "../interfaces/zaraProduct/ZaraProductRepo";

dotenv.config();

export default class SupabaseZaraProductRepoImpl implements ZaraProductRepo {
  private serviceKey: string = process.env.SERVICE_KEY!;
  private supabaseUrl: string = process.env.SUPABASE_URL!;
  private productTable: string = "Product";
  private colorTable: string = "Color";
  private sizeTable: string = "Size";
  private futurePriceTable: string = "Future_price";
  private supabase = createClient(this.supabaseUrl, this.serviceKey);

  public async addZaraProduct(zaraProduct: ZaraProduct): Promise<void> {
    const zaraProductData = zaraProduct.getData();

    try {
      const { error: productError } = await this.supabase
        .from(this.productTable)
        .upsert([
          {
            uuid: zaraProductData.uuid,
            created_at: zaraProductData.created,
            name: zaraProductData.name,
            user_uuid: zaraProductData.userUuid,
            url: zaraProductData.url
          }
        ]);

      if (productError) {
        throw new Error(`Error inserting product: ${productError.message}`);
      }

      const colorPromises = zaraProduct.colors.map(async (color: ColorData) => {
        const { error: colorError } = await this.supabase
          .from(this.colorTable)
          .upsert([
            {
              uuid: color.uuid,
              created_at: color.created,
              name: color.name,
              hex_code: color.hexCode,
              product_id: zaraProductData.uuid,
              image: color.image,
              url: color.url
            }
          ]);

        if (colorError) {
          throw new Error(`Error inserting color: ${colorError.message}`);
        }

        const sizePromises = color.sizes.map(async (size: SizeData) => {
          const { error: sizeError } = await this.supabase
            .from(this.sizeTable)
            .upsert([
              {
                uuid: size.uuid,
                created_at: size.created,
                name: size.name,
                availability: size.availability,
                old_price: size.oldPrice,
                price: size.price,
                discount_percentage: size.discountPercentage,
                color_id: color.uuid,
                product_id: zaraProductData.uuid
              }
            ]);

          if (sizeError) {
            throw new Error(`Error inserting size: ${sizeError.message}`);
          }
        });

        await Promise.all(sizePromises);
      });

      await Promise.all(colorPromises);
    } catch (error: any) {
      throw new Error(`ZaraProduct repository error: ${error.message}`);
    }
  }

  public async addOrUpdateZaraProduct(zaraProduct: ZaraProduct): Promise<void> {
    const zaraProductData = zaraProduct.getData();

    try {
      const { error: productError } = await this.supabase
        .from(this.productTable)
        .upsert([
          {
            uuid: zaraProductData.uuid,
            created_at: zaraProductData.created,
            name: zaraProductData.name,
            user_uuid: zaraProductData.userUuid,
            url: zaraProductData.url
          }
        ]);

      if (productError) {
        throw new Error(`Error upserting product: ${productError.message}`);
      }

      for (const color of zaraProduct.colors) {
        const { error: colorError } = await this.supabase
          .from(this.colorTable)
          .upsert([
            {
              uuid: color.uuid,
              created_at: color.created,
              name: color.name,
              hex_code: color.hexCode,
              product_id: zaraProductData.uuid,
              image: color.image,
              url: color.url
            }
          ]);

        if (colorError) {
          throw new Error(`Error upserting color: ${colorError.message}`);
        }

        for (const size of color.sizes) {
          const { error: sizeError } = await this.supabase
            .from(this.sizeTable)
            .upsert([
              {
                uuid: size.uuid,
                created_at: size.created,
                name: size.name,
                availability: size.availability,
                old_price: size.oldPrice,
                price: size.price,
                discount_percentage: size.discountPercentage,
                color_id: color.uuid,
                product_id: zaraProductData.uuid
              }
            ]);

          if (sizeError) {
            throw new Error(`Error upserting size: ${sizeError.message}`);
          }
        }
      }
    } catch (error: any) {
      throw new Error(`ZaraProduct repository error: ${error.message}`);
    }
  }

  public async getProductDetails(
    userUuid: string,
    name: string
  ): Promise<ZaraProduct | null> {
    try {
      const { data: productData, error: productError } = await this.supabase
        .from(this.productTable)
        .select("*")
        .eq("user_uuid", userUuid)
        .eq("name", name)
        .single();

      if (productError) {
        if (productError.code === "PGRST116") {
          return null;
        } else {
          throw new Error(
            `Error fetching product details: ${productError.message}`
          );
        }
      }

      if (productData) {
        const { data: colorData, error: colorError } = await this.supabase
          .from(this.colorTable)
          .select("*")
          .eq("product_id", productData.uuid);

        if (colorError) {
          throw new Error(
            `Error fetching color details: ${colorError.message}`
          );
        }

        const colors: Color[] = colorData.map(
          (color: any) =>
            new Color(
              color.uuid,
              color.name,
              color.hex_code,
              new Date(color.created_at),
              [],
              color.image,
              color.url,
              color.product_id
            )
        );

        for (const color of colors) {
          const { data: sizeData, error: sizeError } = await this.supabase
            .from(this.sizeTable)
            .select("*")
            .eq("color_id", color.uuid);

          if (sizeError) {
            throw new Error(
              `Error fetching size details: ${sizeError.message}`
            );
          }

          color.sizes = sizeData.map(
            (size: any) =>
              new Size(
                size.uuid,
                size.name,
                size.availability,
                new Date(size.created_at),
                size.old_price,
                size.price,
                size.discount_percentage,
                size.color_id,
                size.product_id
              )
          );
        }

        return new ZaraProduct(
          productData.uuid,
          productData.name,
          productData.url,
          new Date(productData.created_at),
          // productData.state,
          productData.user_uuid,
          colors
        );
      }

      return null;
    } catch (error: any) {
      throw new Error(`ZaraProduct repository error: ${error.message}`);
    }
  }

  public async getProductDetailsById(
    productUuid: string
  ): Promise<ZaraProduct | null> {
    try {
      const { data: productData, error: productError } = await this.supabase
        .from(this.productTable)
        .select("*")
        .eq("uuid", productUuid)
        .single();

      if (productError) {
        if (productError.code === "PGRST116") {
          return null;
        } else {
          throw new Error(
            `Error fetching product details: ${productError.message}`
          );
        }
      }

      if (productData) {
        const { data: colorData, error: colorError } = await this.supabase
          .from(this.colorTable)
          .select("*")
          .eq("product_id", productData.uuid);

        if (colorError) {
          throw new Error(
            `Error fetching color details: ${colorError.message}`
          );
        }

        const colors: Color[] = colorData.map(
          (color: any) =>
            new Color(
              color.uuid,
              color.name,
              color.hex_code,
              new Date(color.created_at),
              [],
              color.image,
              color.url,
              color.product_id
            )
        );

        for (const color of colors) {
          const { data: sizeData, error: sizeError } = await this.supabase
            .from(this.sizeTable)
            .select("*")
            .eq("color_id", color.uuid);

          if (sizeError) {
            throw new Error(
              `Error fetching size details: ${sizeError.message}`
            );
          }

          color.sizes = sizeData.map(
            (size: any) =>
              new Size(
                size.uuid,
                size.name,
                size.availability,
                new Date(size.created_at),
                size.old_price,
                size.price,
                size.discount_percentage,
                size.color_id,
                size.product_id
              )
          );
        }

        return new ZaraProduct(
          productData.uuid,
          productData.name,
          productData.url,
          new Date(productData.created_at),
          // productData.state,
          productData.user_uuid,
          colors
        );
      }

      return null;
    } catch (error: any) {
      throw new Error(`ZaraProduct repository error: ${error.message}`);
    }
  }
}
