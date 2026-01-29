import { Queue, Worker } from 'bullmq';

import { JobService } from '@modules/job/job.service';
import { envConfig } from '@config/env.config';

import { JobQueueService } from '../job-queue.service';
import { JobParsingPayload } from '../queue.types';

// Mock dependencies
jest.mock('bullmq');
jest.mock('@modules/job/job.service');
jest.mock('@utils/logger');
jest.mock('@config/env.config', () => ({
  envConfig: {
    redisUrl: 'redis://localhost:6379',
    queueConcurrency: 3,
    queueRetryAttempts: 3,
    queueRetryDelay: 5000,
  },
}));

describe('JobQueueService', () => {
  let service: JobQueueService;
  let mockQueue: jest.Mocked<Queue>;
  let mockWorker: jest.Mocked<Worker>;
  let mockJobService: jest.Mocked<JobService>;

  beforeEach(() => {
    // Reset singleton
    (JobQueueService as any).instance = null;

    // Mock Queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
      addBulk: jest.fn().mockResolvedValue([{ id: 'job1' }, { id: 'job2' }]),
      getWaitingCount: jest.fn().mockResolvedValue(10),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getCompletedCount: jest.fn().mockResolvedValue(50),
      getFailedCount: jest.fn().mockResolvedValue(1),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    (Queue as unknown as jest.Mock).mockImplementation(() => mockQueue);

    // Mock Worker
    mockWorker = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    (Worker as unknown as jest.Mock).mockImplementation(() => mockWorker);

    service = JobQueueService.getInstance();
    mockJobService = (JobService as unknown as jest.Mock).mock.instances[0];
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = JobQueueService.getInstance();
      const instance2 = JobQueueService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize Queue with correct configuration', () => {
      expect(Queue).toHaveBeenCalledWith('job-parsing', {
        connection: expect.objectContaining({
          host: 'localhost',
          port: 6379,
        }),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });
    });
  });

  describe('enqueueJob', () => {
    const mockPayload: JobParsingPayload = {
      telegramMessageId: 'channel_123',
      channelId: 'test-channel',
      rawText: 'Hiring Node.js developer',
      telegramMessageDate: new Date(),
    };

    it('should enqueue a single job with deduplication', async () => {
      await service.enqueueJob(mockPayload);

      expect(mockQueue.add).toHaveBeenCalledWith('parse', mockPayload, {
        jobId: 'channel_123',
      });
    });
  });

  describe('enqueueJobs', () => {
    const mockPayloads: JobParsingPayload[] = [
      {
        telegramMessageId: 'ch_1',
        channelId: 'test',
        rawText: 'Job 1',
        telegramMessageDate: new Date(),
      },
      {
        telegramMessageId: 'ch_2',
        channelId: 'test',
        rawText: 'Job 2',
        telegramMessageDate: new Date(),
      },
    ];

    it('should enqueue multiple jobs in bulk', async () => {
      await service.enqueueJobs(mockPayloads);

      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        {
          name: 'parse',
          data: mockPayloads[0],
          opts: { jobId: 'ch_1' },
        },
        {
          name: 'parse',
          data: mockPayloads[1],
          opts: { jobId: 'ch_2' },
        },
      ]);
    });
  });

  describe('startWorker', () => {
    it('should start worker with correct configuration', () => {
      service.startWorker();

      expect(Worker).toHaveBeenCalledWith(
        'job-parsing',
        expect.any(Function),
        expect.objectContaining({
          concurrency: 3,
          limiter: { max: 10, duration: 1000 },
        })
      );
    });

    it('should not start worker if already running', () => {
      service.startWorker();
      (Worker as unknown as jest.Mock).mockClear();

      service.startWorker();

      expect(Worker).not.toHaveBeenCalled();
    });

    it('should register completed and failed event handlers', () => {
      service.startWorker();

      expect(mockWorker.on).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockWorker.on).toHaveBeenCalledWith('failed', expect.any(Function));
    });
  });

  describe('stopWorker', () => {
    it('should close worker and queue gracefully', async () => {
      service.startWorker();
      await service.stopWorker();

      expect(mockWorker.close).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
    });

    it('should handle repeated stop calls safely', async () => {
      await service.stopWorker();
      await service.stopWorker();

      expect(mockQueue.close).toHaveBeenCalledTimes(2);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 10,
        active: 2,
        completed: 50,
        failed: 1,
      });

      expect(mockQueue.getWaitingCount).toHaveBeenCalled();
      expect(mockQueue.getActiveCount).toHaveBeenCalled();
      expect(mockQueue.getCompletedCount).toHaveBeenCalled();
      expect(mockQueue.getFailedCount).toHaveBeenCalled();
    });
  });

  describe('processJob (integration)', () => {
    it('should call JobService.createJobFromQueue when processing', async () => {
      // Start worker to capture the processor function
      service.startWorker();

      // Get the processor function passed to Worker constructor
      const processorFn = (Worker as unknown as jest.Mock).mock.calls[0][1];

      const mockJob = {
        id: 'job-123',
        data: {
          telegramMessageId: 'ch_123',
          channelId: 'test-ch',
          rawText: 'Hiring',
          telegramMessageDate: new Date(),
        },
        attemptsMade: 0,
      };

      mockJobService.createJobFromQueue = jest.fn().mockResolvedValue(undefined);

      // Execute the processor
      await processorFn(mockJob);

      expect(mockJobService.createJobFromQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramMessageId: 'ch_123',
          channelId: 'test-ch',
          rawText: 'Hiring',
        })
      );
    });
  });
});
