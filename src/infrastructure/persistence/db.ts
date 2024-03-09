import * as mysql from "mysql2/promise";
import dotenv from "dotenv";
import { FieldPacket, ResultSetHeader } from "mysql2/promise";

dotenv.config();

class Database {
  private connection: mysql.Connection | null = null;
  private isInTransaction: boolean = false;
  private static instance: Database | null;

  constructor() {}

  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database();
      await Database.instance.init();
    }
    return Database.instance;
  }

  private async init() {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
      });

      await this.connection.connect();

      await this.createTables();
    } catch (error: any) {
      console.error("Error initializing database connection:", error.message);
    }
  }

  private async createTables() {
    if (!this.connection) {
      console.error("Database connection not initialized.");
      return;
    }

    try {
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS \`ml_products\` (
          id varchar(100) NOT NULL,
          name varchar(100) NOT NULL,
          url varchar(200) NOT NULL,
          created datetime NOT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS \`ml_product_prices\` (
          ml_product_id varchar(100) NOT NULL,
          price varchar(100) NOT NULL,
          created datetime NOT NULL,
          KEY \`ml_product_price_FK\` (ml_product_id),
          CONSTRAINT \`ml_product_price_FK\` FOREIGN KEY (ml_product_id) REFERENCES \`ml_products\` (id) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS \`scheduled_tasks\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id VARCHAR(100) NOT NULL,
          cron_expression VARCHAR(100) NOT NULL,
          last_run DATETIME,
          created DATETIME NOT NULL,
          deleted DATETIME,
          state VARCHAR(50) NOT NULL,
          KEY \`product_price_schedule_FK\` (product_id),
          CONSTRAINT \`product_price_schedule_FK\` FOREIGN KEY (product_id) REFERENCES \`ml_products\` (id) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
    } catch (error: any) {
      console.error("Error creating tables:", error.message);
    }
  }

  public async insert(table: string, fields: Record<string, any>) {
    try {
      const placeholders: string[] = [];
      const values: any[] = Object.values(fields);
      const fieldNames: string[] = Object.keys(fields);

      for (const name of fieldNames) {
        placeholders.push("?");
      }

      const namesString = fieldNames.join(", ");
      const placeholdersString = placeholders.join(", ");

      const query = `INSERT INTO ${table} (${namesString}) VALUES (${placeholdersString})`;
      const [result] = (await this.connection?.execute(query, values)) as [
        ResultSetHeader,
        FieldPacket[]
      ];

      if (result) {
        console.log(`Inserted ${result.affectedRows} row(s).`);
      }
    } catch (error: any) {
      console.error("Error inserting:", error.message);
    }
  }

  public async initTransaction() {
    try {
      if (!this.connection) {
        console.error("Database connection not initialized.");
        return;
      }

      await this.connection.beginTransaction();
      this.isInTransaction = true;
      console.log("Transaction started.");
    } catch (error: any) {
      console.error("Error initiating transaction:", error.message);
    }
  }

  public async commit() {
    try {
      if (!this.connection) {
        console.error("Database connection not initialized.");
        return;
      }

      await this.connection.commit();
      this.isInTransaction = false;
      console.log("Transaction committed.");
    } catch (error: any) {
      console.error("Error committing transaction:", error.message);
    }
  }

  public async rollback() {
    try {
      if (!this.connection) {
        console.error("Database connection not initialized.");
        return;
      }

      await this.connection.rollback();
      this.isInTransaction = false;
      console.log("Transaction rolled back.");
    } catch (error: any) {
      console.error("Error rolling back transaction:", error.message);
    }
  }

  public async execute(sql: string, values: any[] | null = null) {
    try {
      if (!this.connection) {
        console.error("Database connection not initialized.");
        return;
      }

      if (values === null) {
        await this.connection.execute(sql);
        return;
      }

      await this.connection.execute(sql, values);
    } catch (error: any) {
      console.error("Error executing SQL:", error.message);
    }
  }

  public async executeInTransaction(
    callback: CallableFunction,
    params: any[] | null = null
  ) {
    this.initTransaction();
    try {
      callback(params);
      this.commit();
    } catch (error: any) {
      if (this.inTransaction()) {
        this.rollback();
      }
      console.log("Error executing transaction:", error.message);
    }
  }

  public async result(sql: string, values?: any[]) {
    try {
      if (!this.connection) {
        throw new Error("Database connection not initialized.");
      }

      if (values === undefined) {
        const [row, _] = await this.connection.execute(sql);
        return row;
      }

      const [rows, _] = await this.connection.execute(sql, values);
      return rows;
    } catch (error: any) {
      console.error("Error executing ordered query:", error.message);
      throw error;
    }
  }

  inTransaction(): boolean {
    return this.isInTransaction;
  }
}

export default Database;
