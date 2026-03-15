import cron from 'node-cron';
import { logger } from '@utils/logger';
import academicService from '../modules/academic/academic.service';

/**
 * Academic Year Job
 *
 * Runs daily at 00:05 (5 minutes past midnight) to:
 * 1. Detect whether the current academic year has ended and a new one should be activated
 * 2. Pre-create next year's record ~30 days before the current year ends
 *
 * The actual logic lives in academicService.autoDetectCurrentAcademicYear() which uses
 * the Nepali BS calendar math to find/create/activate the correct year.
 */
class AcademicYearJob {
  private task: cron.ScheduledTask | null = null;

  start(): void {
    // Run at 00:05 every day
    this.task = cron.schedule('5 0 * * *', async () => {
      logger.info('Running academic year rollover check...');
      try {
        await academicService.autoDetectCurrentAcademicYear();

        // Pre-create next year if current year ends within 30 days
        const current = await academicService.getCurrentAcademicYear();
        if (current) {
          const endDate = new Date(current.endDateAD);
          const daysUntilEnd = Math.ceil((endDate.getTime() - Date.now()) / 86_400_000);
          if (daysUntilEnd <= 30) {
            await academicService.ensureNextAcademicYearExists();
          }
        }
      } catch (error) {
        logger.error('Academic year job failed', { error });
      }
    });

    logger.info('✅ Academic year auto-detection job scheduled (daily 00:05)');
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }
}

export const academicYearJob = new AcademicYearJob();
