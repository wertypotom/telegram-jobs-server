import { JobService } from '../job.service';
import { JobRepository } from '../job.repository';
import { JobParserService } from '../services/job-parser.service';
import { UserRepository } from '../../user/user.repository';
import { CreateJobDto } from '../job.types';

// Mock dependencies
jest.mock('../job.repository');
jest.mock('../services/job-parser.service');
jest.mock('../../user/user.repository');
jest.mock('@utils/logger');

describe('JobService', () => {
  let service: JobService;
  let mockJobRepo: jest.Mocked<JobRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockParserService: jest.Mocked<JobParserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobService();
    mockJobRepo = (JobRepository as unknown as jest.Mock).mock.instances[0];
    mockUserRepo = (UserRepository as unknown as jest.Mock).mock.instances[0];
    mockParserService = (JobParserService as unknown as jest.Mock).mock
      .instances[0];
  });

  describe('createJob', () => {
    const mockJobData: CreateJobDto = {
      telegramMessageId: '123',
      channelId: 'channel-1',
      telegramMessageDate: new Date(),
      rawText: 'Hiring Node.js developer',
      senderUserId: 'sender-1',
    };

    it('should ignore duplicate jobs', async () => {
      mockJobRepo.findByMessageId.mockResolvedValue({
        _id: 'existing-job',
      } as any);

      await service.createJob(mockJobData);

      expect(mockJobRepo.create).not.toHaveBeenCalled();
    });

    it('should create job and trigger async parsing', async () => {
      mockJobRepo.findByMessageId.mockResolvedValue(null);
      mockJobRepo.create.mockResolvedValue({ _id: 'new-job' } as any);
      // Mock parser to ensure async call doesn't fail
      mockParserService.parseJobText.mockResolvedValue(null);

      await service.createJob(mockJobData);

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending_parse',
        })
      );
    });
  });

  describe('getJobFeed', () => {
    const mockUser = {
      _id: 'user-1',
      plan: 'free',
      subscribedChannels: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'], // 6 channels
      viewedJobs: ['job-1'],
    };

    it('should enforce user channel subscriptions', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockJobRepo.findWithFilters.mockResolvedValue({ jobs: [], total: 0 });

      await service.getJobFeed({ limit: 10, offset: 0 }, 'user-1');

      const callArgs = mockJobRepo.findWithFilters.mock.calls[0][0];
      expect(callArgs.channelIds).toBeDefined();
    });

    it('should limit free tier users to 5 channels', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockJobRepo.findWithFilters.mockResolvedValue({ jobs: [], total: 0 });

      await service.getJobFeed({ limit: 10, offset: 0 }, 'user-1');

      const callArgs = mockJobRepo.findWithFilters.mock.calls[0][0];
      expect(callArgs.channelIds).toHaveLength(5);
      expect(callArgs.channelIds).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5']);
    });

    it('should mark viewed jobs correctly', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      const mockJobs = [
        { _id: 'job-1', channelId: 'ch1' }, // Viewed
        { _id: 'job-2', channelId: 'ch1' }, // Not viewed
      ];
      mockJobRepo.findWithFilters.mockResolvedValue({
        jobs: mockJobs as any,
        total: 2,
      });

      const result = await service.getJobFeed({ limit: 10 }, 'user-1');

      expect(result.jobs[0].isVisited).toBe(true);
      expect(result.jobs[1].isVisited).toBe(false);
    });
  });

  describe('searchSkills', () => {
    it('should return skills matching query case-insensitively', async () => {
      const results = await service.searchSkills('node');
      expect(results).toContain('Node.js');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return default skills when query is empty', async () => {
      const results = await service.searchSkills('');
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(20);
    });
  });

  describe('markJobAsViewed', () => {
    it('should add job to user viewed list if not already viewed', async () => {
      mockUserRepo.findById.mockResolvedValue({
        viewedJobs: ['old-job'],
      } as any);
      mockJobRepo.findById.mockResolvedValue({ _id: 'new-job' } as any);

      await service.markJobAsViewed('user-1', 'new-job');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        viewedJobs: ['old-job', 'new-job'],
      });
    });

    it('should not update if job already viewed', async () => {
      mockUserRepo.findById.mockResolvedValue({
        viewedJobs: ['job-1'],
      } as any);
      mockJobRepo.findById.mockResolvedValue({ _id: 'job-1' } as any);

      await service.markJobAsViewed('user-1', 'job-1');

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });
});
