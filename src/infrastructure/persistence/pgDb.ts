import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

class Database {
  private connection: Pool | null = null;
  private isInTransaction: boolean = false;
  private static instance: Database | null;

  private constructor() {}

  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database();
      await Database.instance.init();
    }
    return Database.instance;
  }

  private async init() {
    try {
      this.connection = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || "5432")
      });
      console.log("PostgreSQL connection initialized.");
      await this.createTables();
    } catch (error: any) {
      console.error("Error initializing database connection:", error.message);
      throw new Error(
        "Error initializing database connection: " + error.message
      );
    }
  }

  private async createTables() {
    if (!this.connection) {
      throw new Error("Database connection not initialized.");
    }

    try {
      await this.connection.query(`
            CREATE TABLE IF NOT EXISTS ml_products (
                id UUID PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                url VARCHAR(1000) NOT NULL,
                created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
      await this.connection.query(`
            CREATE TABLE IF NOT EXISTS ml_product_prices (
                id SERIAL PRIMARY KEY,
                ml_product_id UUID NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ml_product_id) REFERENCES ml_products(id) ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
      await this.connection.query(`
            CREATE TABLE IF NOT EXISTS scheduled_tasks (
                id SERIAL PRIMARY KEY,
                product_id UUID NOT NULL,
                cron_expression VARCHAR(100) NOT NULL,
                last_run TIMESTAMP,
                created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted TIMESTAMP,
                state VARCHAR(50) NOT NULL,
                FOREIGN KEY (product_id) REFERENCES ml_products(id) ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
    } catch (error: any) {
      console.error("Error creating tables:", error.message);
      throw new Error("Error creating tables: " + error.message);
    }
  }

  public async insert(table: string, fields: Record<string, any>) {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      const fieldNames: string[] = Object.keys(fields);
      const placeholders: string[] = [];
      const values: any[] = [];

      for (const name of fieldNames) {
        placeholders.push(`$${placeholders.length + 1}`);
        values.push(fields[name]);
      }

      const namesString = fieldNames.join(", ");
      const placeholdersString = placeholders.join(", ");

      const query = `INSERT INTO ${table} (${namesString}) VALUES (${placeholdersString}) RETURNING *`;
      const result = await this.connection.query(query, values);

      if (result.rowCount) {
        console.log(`Inserted ${result.rowCount} row(s).`);
      }
    } catch (error: any) {
      console.error("Error inserting:", error.message);
      throw new Error("Error inserting: " + error.message);
    }
  }

  public async initTransaction() {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      await this.connection.query("BEGIN");
      this.isInTransaction = true;
      console.log("Transaction started.");
    } catch (error: any) {
      console.error("Error initiating transaction:", error.message);
      throw new Error("Error initiating transaction: " + error.message);
    }
  }

  public async commit() {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      await this.connection.query("COMMIT");
      this.isInTransaction = false;
      console.log("Transaction committed.");
    } catch (error: any) {
      console.error("Error committing transaction:", error.message);
      throw new Error("Error committing transaction: " + error.message);
    }
  }

  public async rollback() {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      await this.connection.query("ROLLBACK");
      this.isInTransaction = false;
      console.log("Transaction rolled back.");
    } catch (error: any) {
      console.error("Error rolling back transaction:", error.message);
      throw new Error("Error rolling back transaction: " + error.message);
    }
  }

  public async execute(sql: string, values: any[] | null = null) {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      if (values === null) {
        await this.connection.query(sql);
        return;
      }

      await this.connection.query(sql, values);
    } catch (error: any) {
      console.error("Error executing SQL:", error.message);
      throw new Error("Error executing SQL: " + error.message);
    }
  }

  public async executeInTransaction(
    callback: CallableFunction,
    params: any[] | null = null
  ) {
    await this.initTransaction();
    try {
      await callback(params);
      await this.commit();
    } catch (error: any) {
      if (this.inTransaction()) {
        await this.rollback();
      }
      console.log("Error executing transaction:", error.message);
      throw new Error("Error executing transaction: " + error.message);
    }
  }

  public async result(sql: string, values?: any[]) {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      const result = values
        ? await this.connection.query(sql, values)
        : await this.connection.query(sql);
      return result.rows;
    } catch (error: any) {
      console.error("Error executing query:", error.message);
      throw new Error("Error executing query: " + error.message);
    }
  }

  inTransaction(): boolean {
    return this.isInTransaction;
  }
}

export default Database;
