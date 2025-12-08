import { ChannelRepository } from '@modules/channel/channel.repository';
import { Logger } from '@utils/logger';

export interface PlatformStats {
  activeChannels: number;
  jobsToday: number;
  totalJobs: number;
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

      // Count monitored channels
      const activeChannels = await this.channelRepository.countMonitored();

      // Count jobs in last 24 hours (rolling window, timezone-independent)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const jobsToday = await Job.countDocuments({
        createdAt: { $gte: last24Hours },
        status: 'parsed', // Only count successfully parsed jobs
      });

      // Total parsed jobs
      const totalJobs = await Job.countDocuments({
        status: 'parsed',
      });

      Logger.info('Platform stats retrieved', {
        activeChannels,
        jobsToday,
        totalJobs,
      });

      return {
        activeChannels,
        jobsToday,
        totalJobs,
      };
    } catch (error) {
      Logger.error('Failed to get platform stats:', error);
      // Return safe defaults on error
      return {
        activeChannels: 0,
        jobsToday: 0,
        totalJobs: 0,
      };
    }
  }
}
