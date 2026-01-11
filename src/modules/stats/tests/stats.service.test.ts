import { ChannelRepository } from '../../channel/channel.repository';
import { StatsService } from '../stats.service';

// Mock dependencies
jest.mock('@utils/logger');
jest.mock('../../channel/channel.repository');

// Mock models will be imported dynamically in the service
jest.mock('@modules/job/job.model', () => ({
  Job: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('@modules/job/archived-job.model', () => ({
  ArchivedJob: {
    countDocuments: jest.fn(),
  },
}));

describe('StatsService', () => {
  let service: StatsService;
  let mockChannelRepo: jest.Mocked<ChannelRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    service = new StatsService();
    mockChannelRepo = (ChannelRepository as unknown as jest.Mock).mock.instances[0];
  });

  describe('getPlatformStats', () => {
    it('should return stats with 7-day job count and total including archived', async () => {
      // Mock channel count
      mockChannelRepo.countMonitored.mockResolvedValue(42);

      // Mock Job model counts
      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;

      // Jobs in last 7 days
      mockJobCountDocuments.mockResolvedValueOnce(156);
      // Total active parsed jobs
      mockJobCountDocuments.mockResolvedValueOnce(5000);

      // Mock ArchivedJob model counts
      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(10000);

      const stats = await service.getPlatformStats();

      expect(stats).toEqual({
        activeChannels: 42,
        jobsLast7Days: 156,
        totalJobs: 15000, // 5000 active + 10000 archived
      });
    });

    it('should query jobs with correct 7-day date range', async () => {
      mockChannelRepo.countMonitored.mockResolvedValue(10);

      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;
      mockJobCountDocuments.mockResolvedValue(100);

      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(200);

      await service.getPlatformStats();

      // Verify 7-day query
      const firstCall = mockJobCountDocuments.mock.calls[0][0];
      expect(firstCall).toHaveProperty('telegramMessageDate');
      expect(firstCall.telegramMessageDate).toHaveProperty('$gte');
      expect(firstCall.status).toBe('parsed');

      // Check date is roughly 7 days ago (within 1 minute tolerance)
      const expectedDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const actualDate = firstCall.telegramMessageDate.$gte;
      const timeDiff = Math.abs(expectedDate.getTime() - actualDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute
    });

    it('should only count parsed jobs in both collections', async () => {
      mockChannelRepo.countMonitored.mockResolvedValue(10);

      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;
      mockJobCountDocuments.mockResolvedValue(100);

      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(200);

      await service.getPlatformStats();

      // Verify all queries filter by status: 'parsed'
      const jobCalls = mockJobCountDocuments.mock.calls;
      jobCalls.forEach((call) => {
        expect(call[0].status).toBe('parsed');
      });

      const archivedCall = mockArchivedCountDocuments.mock.calls[0][0];
      expect(archivedCall.status).toBe('parsed');
    });

    it('should return safe defaults on error', async () => {
      mockChannelRepo.countMonitored.mockRejectedValue(new Error('DB error'));

      const stats = await service.getPlatformStats();

      expect(stats).toEqual({
        activeChannels: 0,
        jobsLast7Days: 0,
        totalJobs: 0,
      });
    });

    it('should aggregate correctly when active jobs is 0', async () => {
      mockChannelRepo.countMonitored.mockResolvedValue(5);

      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;
      mockJobCountDocuments.mockResolvedValueOnce(0); // 7-day count
      mockJobCountDocuments.mockResolvedValueOnce(0); // active count

      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(500);

      const stats = await service.getPlatformStats();

      expect(stats).toEqual({
        activeChannels: 5,
        jobsLast7Days: 0,
        totalJobs: 500, // 0 active + 500 archived
      });
    });

    it('should aggregate correctly when archived jobs is 0', async () => {
      mockChannelRepo.countMonitored.mockResolvedValue(5);

      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;
      mockJobCountDocuments.mockResolvedValueOnce(50); // 7-day count
      mockJobCountDocuments.mockResolvedValueOnce(1000); // active count

      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(0);

      const stats = await service.getPlatformStats();

      expect(stats).toEqual({
        activeChannels: 5,
        jobsLast7Days: 50,
        totalJobs: 1000, // 1000 active + 0 archived
      });
    });

    it('should handle very large numbers correctly', async () => {
      mockChannelRepo.countMonitored.mockResolvedValue(100);

      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;
      mockJobCountDocuments.mockResolvedValueOnce(5000); // 7-day
      mockJobCountDocuments.mockResolvedValueOnce(50000); // active

      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(150000);

      const stats = await service.getPlatformStats();

      expect(stats.totalJobs).toBe(200000); // 50000 + 150000
      expect(stats.jobsLast7Days).toBe(5000);
    });
  });

  describe('interface compatibility', () => {
    it('should match PlatformStats interface', async () => {
      mockChannelRepo.countMonitored.mockResolvedValue(1);

      const { Job } = await import('@modules/job/job.model');
      const mockJobCountDocuments = Job.countDocuments as jest.Mock;
      mockJobCountDocuments.mockResolvedValue(1);

      const { ArchivedJob } = await import('@modules/job/archived-job.model');
      const mockArchivedCountDocuments = ArchivedJob.countDocuments as jest.Mock;
      mockArchivedCountDocuments.mockResolvedValue(1);

      const stats = await service.getPlatformStats();

      // Verify interface has exactly 3 properties
      expect(Object.keys(stats)).toEqual(['activeChannels', 'jobsLast7Days', 'totalJobs']);

      // Verify types
      expect(typeof stats.activeChannels).toBe('number');
      expect(typeof stats.jobsLast7Days).toBe('number');
      expect(typeof stats.totalJobs).toBe('number');
    });
  });
});
