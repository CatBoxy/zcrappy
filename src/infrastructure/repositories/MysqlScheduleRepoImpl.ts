import Schedule from "../interfaces/schedule/Schedule";
import { ScheduleRepo, ScheduleRow } from "../interfaces/schedule/ScheduleRepo";
import Database from "../persistence/db";

export default class MysqlScheduleRepoImpl implements ScheduleRepo {
  private db: Database;
  private mainTable: string = "scheduled_tasks";

  constructor(db: Database) {
    this.db = db;
  }

  public initTransaction(): void {
    this.db.initTransaction();
  }

  public commitTransaction(): void {
    this.db.commit();
  }

  public rollbackTransaction(): void {
    this.db.rollback();
  }

  public addSchedule(schedule: Schedule): void {
    try {
      const scheduleData = schedule.getData();

      this.db.insert(this.mainTable, {
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

  public updateLastRun(schedule: Schedule): void {
    // const mlProductData = mlProduct.getData();
    // this.db.insert(this.pricesTable, {
    //   ml_product_id: mlProductData.id,
    //   price: mlProductData.price,
    //   created: mlProductData.created
    // });
  }
}
