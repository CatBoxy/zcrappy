import { ScheduleRepo } from "../infrastructure/interfaces/schedule/ScheduleRepo";
import Schedule from "../infrastructure/interfaces/schedule/Schedule";
import initializeSchedule from "../services/initializeSchedule";
import { ScheduleState } from "../enums/ScheduleState";

interface ScheduleController {
  schedule(filename: string, query: string): Promise<void>;
  initSchedule(productId: string, cronExpression: string): Promise<void>;
}

export default class ScheduleControllerImpl implements ScheduleController {
  private scheduleRepo: ScheduleRepo;

  constructor(scheduleRepo: ScheduleRepo) {
    this.scheduleRepo = scheduleRepo;
  }

  public async schedule(productId: string): Promise<void> {
    const cronExpression = "0 0 * * *";
    const schedule = new Schedule(
      productId,
      cronExpression,
      undefined,
      new Date(),
      undefined,
      ScheduleState.Playing
    );

    try {
      await this.scheduleRepo.initTransaction();
      await this.scheduleRepo.addSchedule(schedule);
      await this.scheduleRepo.commitTransaction();

      this.initSchedule(productId, cronExpression);
    } catch (error: any) {
      console.error("Error saving schedule:", error.message);
      this.scheduleRepo.rollbackTransaction();
      throw new Error("Schedule controller error: " + error.message);
    }
  }

  public async initSchedule(productId: string, cronExpression: string) {
    await initializeSchedule(productId, cronExpression);
  }
}
