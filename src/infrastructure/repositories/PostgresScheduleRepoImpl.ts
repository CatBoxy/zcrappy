import Schedule from "../interfaces/schedule/Schedule";
import { ScheduleRepo, ScheduleRow } from "../interfaces/schedule/ScheduleRepo";
import Database from "../persistence/pgDb";

export default class MysqlScheduleRepoImpl implements ScheduleRepo {
  private db: Database;
  private mainTable: string = "scheduled_tasks";

  constructor(db: Database) {
    this.db = db;
  }

  public async initTransaction(): Promise<void> {
    await this.db.initTransaction();
  }

  public async commitTransaction(): Promise<void> {
    await this.db.commit();
  }

  public async rollbackTransaction(): Promise<void> {
    await this.db.rollback();
  }

  public async addSchedule(schedule: Schedule): Promise<void> {
    try {
      const scheduleData = schedule.getData();

      await this.db.insert(this.mainTable, {
        product_id: scheduleData.productId,
        cron_expression: scheduleData.cronExpression,
        created: scheduleData.created,
        state: scheduleData.state
      });
    } catch (error: any) {
      throw new Error("Schedule repository error: " + error.message);
    }
  }

  public async getAllSchedules(): Promise<Array<ScheduleRow>> {
    try {
      const query = `SELECT product_id, cron_expression FROM scheduled_tasks`;
      const scheduleRows = (await this.db.result(query)) as any;
      return scheduleRows;
    } catch (error: any) {
      throw new Error("Schedule repository error: " + error.message);
    }
  }

  public async updateLastRun(schedule: Schedule): Promise<void> {
    // const mlProductData = mlProduct.getData();
    // this.db.insert(this.pricesTable, {
    //   ml_product_id: mlProductData.id,
    //   price: mlProductData.price,
    //   created: mlProductData.created
    // });
  }
}
