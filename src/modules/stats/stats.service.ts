import { ChannelRepository } from '@modules/channel/channel.repository';
import { Logger } from '@utils/logger';

export interface PlatformStats {
  activeChannels: number;
  jobsLast7Days: number; // Changed from jobsToday
  totalJobs: number; // Now includes archived
}

/**
 * StatsService - Public platform statistics
 * Provides aggregate metrics for marketing/landing page
 */
export class StatsService {
  private channelRepository: ChannelRepository;

  constructor() {
    this.channelRepository = new ChannelRepository();
  }

  /**
   * Get platform-wide statistics (public, no auth required)
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const { Job } = await import('@modules/job/job.model');
      const { ArchivedJob } = await import('@modules/job/archived-job.model');

      // Count monitored channels
      const activeChannels = await this.channelRepository.countMonitored();

      // Count jobs in last 7 days (rolling window)
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const jobsLast7Days = await Job.countDocuments({
        telegramMessageDate: { $gte: last7Days },
        status: 'parsed', // Only count successfully parsed jobs
      });

      // Total parsed jobs (active + archived)
      const activeJobsCount = await Job.countDocuments({
        status: 'parsed',
      });

      const archivedJobsCount = await ArchivedJob.countDocuments({
        status: 'parsed',
      });

      const totalJobs = activeJobsCount + archivedJobsCount;

      Logger.info('Platform stats retrieved', {
        activeChannels,
        jobsLast7Days,
        totalJobs,
        breakdown: {
          active: activeJobsCount,
          archived: archivedJobsCount,
        },
      });

      return {
        activeChannels,
        jobsLast7Days,
        totalJobs,
      };
    } catch (error) {
      Logger.error('Failed to get platform stats:', error);
      // Return safe defaults on error
      return {
        activeChannels: 0,
        jobsLast7Days: 0,
        totalJobs: 0,
      };
    }
  }
}
