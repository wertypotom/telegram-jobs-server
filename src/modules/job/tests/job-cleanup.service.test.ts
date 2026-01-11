import { ArchivedJob } from '../archived-job.model';
import { Job } from '../job.model';
import { JobCleanupService } from '../job-cleanup.service';

// Mock dependencies
jest.mock('@utils/logger');
jest.mock('../job.model');
jest.mock('../archived-job.model');

describe('JobCleanupService', () => {
  let service: JobCleanupService;
  let mockFind: jest.Mock;
  let mockDeleteOne: jest.Mock;
  let mockCountDocuments: jest.Mock;
  let mockArchivedCreate: jest.Mock;
  let mockArchivedCountDocuments: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Job model methods
    mockFind = jest.fn();
    mockDeleteOne = jest.fn();
    mockCountDocuments = jest.fn();
    (Job.find as jest.Mock) = mockFind;
    (Job.deleteOne as jest.Mock) = mockDeleteOne;
    (Job.countDocuments as jest.Mock) = mockCountDocuments;

    // Mock ArchivedJob model methods
    mockArchivedCreate = jest.fn();
    mockArchivedCountDocuments = jest.fn();
    (ArchivedJob.create as jest.Mock) = mockArchivedCreate;
    (ArchivedJob.countDocuments as jest.Mock) = mockArchivedCountDocuments;

    service = new JobCleanupService();
  });

  describe('runCleanup', () => {
    it('should archive jobs older than 7 days successfully', async () => {
      // Mock old jobs to archive
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const mockOldJobs = [
        {
          _id: 'job-1',
          telegramMessageId: 'msg-1',
          channelId: 'channel-1',
          parsedData: {
            jobTitle: 'Senior Node.js Developer',
            normalizedJobTitle: 'senior nodejs developer',
            company: 'TechCorp',
            techStack: ['Node.js', 'TypeScript'],
            salary: '$100k-$150k',
            level: 'Senior',
            isRemote: true,
            experienceYears: 5,
            description: 'Long description...', // Should be omitted in archive
          },
          status: 'parsed',
          telegramMessageDate: new Date('2024-01-01'),
          rawText: 'Hiring Node.js developer...', // Should be omitted
        },
        {
          _id: 'job-2',
          telegramMessageId: 'msg-2',
          channelId: 'channel-2',
          parsedData: {
            jobTitle: 'React Developer',
            company: 'StartupXYZ',
            techStack: ['React', 'JavaScript'],
          },
          status: 'parsed',
          telegramMessageDate: new Date('2024-01-02'),
        },
      ];

      mockFind.mockResolvedValue(mockOldJobs);
      mockArchivedCreate.mockResolvedValue({});
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      mockCountDocuments.mockResolvedValue(100); // Active jobs
      mockArchivedCountDocuments.mockResolvedValue(50); // Archived jobs

      await service.runCleanup();

      // Verify archive was created with metadata only
      expect(mockArchivedCreate).toHaveBeenCalledTimes(2);
      expect(mockArchivedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramMessageId: 'msg-1',
          channelId: 'channel-1',
          parsedData: expect.objectContaining({
            jobTitle: 'Senior Node.js Developer',
            normalizedJobTitle: 'senior nodejs developer',
            company: 'TechCorp',
            techStack: ['Node.js', 'TypeScript'],
            salary: '$100k-$150k',
            level: 'Senior',
            isRemote: true,
            experienceYears: 5,
          }),
          status: 'parsed',
          telegramMessageDate: expect.any(Date),
          archivedAt: expect.any(Date),
        })
      );

      // Verify heavy fields are NOT included
      const archivedJobData = mockArchivedCreate.mock.calls[0][0];
      expect(archivedJobData.rawText).toBeUndefined();
      expect(archivedJobData.parsedData.description).toBeUndefined();

      // Verify original jobs were deleted
      expect(mockDeleteOne).toHaveBeenCalledTimes(2);
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'job-1' });
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'job-2' });
    });

    it('should handle duplicate archive errors gracefully', async () => {
      const mockJob = {
        _id: 'job-1',
        telegramMessageId: 'msg-1',
        channelId: 'channel-1',
        parsedData: { jobTitle: 'Developer' },
        status: 'parsed',
        telegramMessageDate: new Date('2024-01-01'),
      };

      mockFind.mockResolvedValue([mockJob]);

      // Simulate duplicate key error (job already archived)
      const duplicateError = new Error('Duplicate key');
      (duplicateError as any).code = 11000;
      mockArchivedCreate.mockRejectedValue(duplicateError);

      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      mockCountDocuments.mockResolvedValue(100);
      mockArchivedCountDocuments.mockResolvedValue(50);

      await service.runCleanup();

      // Should still delete the job from active collection
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'job-1' });
    });

    it('should NOT delete job if archive fails with non-duplicate error', async () => {
      const mockJob = {
        _id: 'job-1',
        telegramMessageId: 'msg-1',
        channelId: 'channel-1',
        parsedData: { jobTitle: 'Developer' },
        status: 'parsed',
        telegramMessageDate: new Date('2024-01-01'),
      };

      mockFind.mockResolvedValue([mockJob]);

      // Simulate network/DB error
      mockArchivedCreate.mockRejectedValue(new Error('Network timeout'));

      mockCountDocuments.mockResolvedValue(100);
      mockArchivedCountDocuments.mockResolvedValue(50);

      await service.runCleanup();

      // Should NOT delete the job (preserve for retry)
      expect(mockDeleteOne).not.toHaveBeenCalled();
    });

    it('should handle jobs without parsedData', async () => {
      const mockJob = {
        _id: 'job-1',
        telegramMessageId: 'msg-1',
        channelId: 'channel-1',
        parsedData: undefined,
        status: 'pending_parse',
        telegramMessageDate: new Date('2024-01-01'),
      };

      mockFind.mockResolvedValue([mockJob]);
      mockArchivedCreate.mockResolvedValue({});
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      mockCountDocuments.mockResolvedValue(100);
      mockArchivedCountDocuments.mockResolvedValue(50);

      await service.runCleanup();

      expect(mockArchivedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          parsedData: undefined,
        })
      );
      expect(mockDeleteOne).toHaveBeenCalled();
    });

    it('should do nothing if no old jobs exist', async () => {
      mockFind.mockResolvedValue([]);

      await service.runCleanup();

      expect(mockArchivedCreate).not.toHaveBeenCalled();
      expect(mockDeleteOne).not.toHaveBeenCalled();
    });

    it('should track archived/failed/skipped counters correctly', async () => {
      const mockJobs = [
        {
          _id: 'job-1',
          telegramMessageId: 'msg-1',
          channelId: 'ch1',
          parsedData: {},
          status: 'parsed',
          telegramMessageDate: new Date('2024-01-01'),
        },
        {
          _id: 'job-2',
          telegramMessageId: 'msg-2',
          channelId: 'ch2',
          parsedData: {},
          status: 'parsed',
          telegramMessageDate: new Date('2024-01-02'),
        },
        {
          _id: 'job-3',
          telegramMessageId: 'msg-3',
          channelId: 'ch3',
          parsedData: {},
          status: 'parsed',
          telegramMessageDate: new Date('2024-01-03'),
        },
      ];

      mockFind.mockResolvedValue(mockJobs);

      // First job: success
      mockArchivedCreate
        .mockResolvedValueOnce({})
        // Second job: duplicate (already archived)
        .mockRejectedValueOnce({ code: 11000, message: 'Duplicate' })
        // Third job: network error
        .mockRejectedValueOnce(new Error('Network timeout'));

      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      mockCountDocuments.mockResolvedValue(100);
      mockArchivedCountDocuments.mockResolvedValue(50);

      await service.runCleanup();

      // Verify counters: 1 archived, 1 failed, 1 skipped
      expect(mockArchivedCreate).toHaveBeenCalledTimes(3);
      expect(mockDeleteOne).toHaveBeenCalledTimes(2); // job-1 and job-2 (duplicate)
      // job-3 should NOT be deleted (network error)
    });
  });

  describe('start/stop', () => {
    it('should start cleanup service and run immediately', async () => {
      mockFind.mockResolvedValue([]);

      service.start();

      // Cleanup should run immediately on start
      expect(mockFind).toHaveBeenCalled();

      service.stop();
    });

    it('should not start if already running', () => {
      mockFind.mockResolvedValue([]);

      service.start();
      const firstCallCount = mockFind.mock.calls.length;

      service.start(); // Try to start again

      // Should not trigger another immediate cleanup
      expect(mockFind.mock.calls.length).toBe(firstCallCount);

      service.stop();
    });
  });
});
