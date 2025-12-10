import { Job } from '../job/job.model';
import { Logger } from '@utils/logger';

/**
 * Job Cleanup Service
 * Automatically deletes jobs older than specified retention period
 */
export class JobCleanupService {
  private readonly RETENTION_DAYS = 3; // Jobs older than 3 days are deleted
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

    Logger.info(
      `Job cleanup service started. Will run every ${this.RETENTION_DAYS} days.`
    );
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
   * Perform the cleanup operation
   */
  private async performCleanup(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      Logger.info(
        `Starting job cleanup for jobs older than ${cutoffDate.toISOString()}`
      );

      // Count jobs before deletion
      const oldJobCount = await Job.countDocuments({
        createdAt: { $lt: cutoffDate },
      });

      if (oldJobCount === 0) {
        Logger.info('No old jobs to delete');
        return;
      }

      // Delete old jobs
      const result = await Job.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      Logger.info(
        `Job cleanup completed. Deleted ${result.deletedCount} jobs older than ${this.RETENTION_DAYS} days.`
      );

      // Log current database stats
      const remainingJobs = await Job.countDocuments();
      Logger.info(`Remaining jobs in database: ${remainingJobs}`);
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
