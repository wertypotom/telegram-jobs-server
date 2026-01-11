import { Logger } from '@utils/logger';

import { ArchivedJob } from '../job/archived-job.model';
import { Job } from '../job/job.model';

/**
 * Job Cleanup Service
 * Archives jobs older than 7 days to separate collection for SEO/statistics
 */
export class JobCleanupService {
  private readonly RETENTION_DAYS = 7; // Jobs older than 7 days are archived
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Run daily
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Start the cleanup service
   */
  start(): void {
    if (this.cleanupInterval) {
      Logger.warn('Job cleanup service is already running');
      return;
    }

    Logger.info('Starting job cleanup service...');

    // Run cleanup immediately on start
    this.performCleanup();

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL_MS);

    Logger.info(`Job cleanup service started. Will run every ${this.RETENTION_DAYS} days.`);
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      Logger.info('Job cleanup service stopped');
    }
  }

  /**
   * Perform the cleanup operation - archive old jobs instead of deleting
   */
  private async performCleanup(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      Logger.info(
        `Starting job archival for jobs with telegramMessageDate older than ${cutoffDate.toISOString()}`
      );

      // Find jobs to archive
      const oldJobs = await Job.find({
        telegramMessageDate: { $lt: cutoffDate },
      });

      if (oldJobs.length === 0) {
        Logger.info('No old jobs to archive');
        return;
      }

      Logger.info(`Found ${oldJobs.length} jobs to archive`);

      // Track results
      let archivedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      // Archive each job individually with error handling
      for (const job of oldJobs) {
        try {
          // Extract metadata only (no heavy text fields)
          const archivedJobData = {
            telegramMessageId: job.telegramMessageId,
            channelId: job.channelId,
            parsedData: job.parsedData
              ? {
                  jobTitle: job.parsedData.jobTitle,
                  normalizedJobTitle: job.parsedData.normalizedJobTitle,
                  company: job.parsedData.company,
                  techStack: job.parsedData.techStack,
                  salary: job.parsedData.salary,
                  level: job.parsedData.level,
                  isRemote: job.parsedData.isRemote,
                  experienceYears: job.parsedData.experienceYears,
                }
              : undefined,
            status: job.status,
            telegramMessageDate: job.telegramMessageDate,
            archivedAt: new Date(),
          };

          // Try to insert into ArchivedJob collection
          await ArchivedJob.create(archivedJobData);

          // Only delete if archive succeeded
          await Job.deleteOne({ _id: job._id });

          archivedCount++;
        } catch (error: any) {
          // Handle duplicate key errors (already archived)
          if (error.code === 11000) {
            // Job already archived, safe to delete from active collection
            await Job.deleteOne({ _id: job._id });
            skippedCount++;
            Logger.debug(
              `Job ${job.telegramMessageId} already archived, removed from active collection`
            );
          } else {
            // Other errors - keep job in active collection for retry
            failedCount++;
            Logger.error(`Failed to archive job ${job.telegramMessageId}:`, error.message || error);
          }
        }
      }

      // Log summary
      Logger.info(
        `Job cleanup completed. Archived: ${archivedCount}, Failed: ${failedCount}, Skipped (already archived): ${skippedCount}`
      );

      // Log current database stats
      const remainingActiveJobs = await Job.countDocuments();
      const totalArchivedJobs = await ArchivedJob.countDocuments();
      Logger.info(
        `Database stats - Active jobs: ${remainingActiveJobs}, Archived jobs: ${totalArchivedJobs}`
      );
    } catch (error) {
      Logger.error('Job cleanup failed:', error);
    }
  }

  /**
   * Manually trigger cleanup (useful for testing)
   */
  async runCleanup(): Promise<void> {
    await this.performCleanup();
  }
}
