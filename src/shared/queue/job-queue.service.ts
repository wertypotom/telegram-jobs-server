import { Queue, Worker, Job } from 'bullmq';
import { envConfig } from '@config/env.config';
import { JobService } from '@modules/job/job.service';
import * as Sentry from '@sentry/node';
import { Logger } from '@utils/logger';
import { JobParsingPayload, QueueStats, QUEUE_NAMES } from './queue.types';

/**
 * JobQueueService - Manages background job parsing queue
 *
 * Singleton pattern to ensure single queue/worker instance.
 * Uses Redis via BullMQ for persistent, distributed job processing.
 */
export class JobQueueService {
  private static instance: JobQueueService | null = null;

  private queue: Queue;
  private worker: Worker | null = null;
  private jobService: JobService;

  private readonly connection = {
    host: new URL(envConfig.redisUrl).hostname,
    port: parseInt(new URL(envConfig.redisUrl).port) || 6379,
    password: new URL(envConfig.redisUrl).password || undefined,
    maxRetriesPerRequest: null,
  };

  private constructor() {
    this.jobService = new JobService();

    this.queue = new Queue(QUEUE_NAMES.JOB_PARSING, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: envConfig.queueRetryAttempts,
        backoff: { type: 'exponential', delay: envConfig.queueRetryDelay },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    Logger.info('JobQueueService initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Enqueue single job for parsing
   */
  async enqueueJob(payload: JobParsingPayload): Promise<void> {
    await this.queue.add('parse', payload, {
      jobId: payload.telegramMessageId, // Dedupe by message ID
    });
  }

  /**
   * Enqueue multiple jobs for parsing (batch)
   */
  async enqueueJobs(payloads: JobParsingPayload[]): Promise<void> {
    const jobs = payloads.map((payload) => ({
      name: 'parse',
      data: payload,
      opts: { jobId: payload.telegramMessageId },
    }));
    await this.queue.addBulk(jobs);
    Logger.info(`Enqueued ${payloads.length} jobs for parsing`);
  }

  /**
   * Start the background worker
   */
  startWorker(): void {
    if (this.worker) {
      Logger.warn('Worker already running');
      return;
    }

    this.worker = new Worker(
      QUEUE_NAMES.JOB_PARSING,
      async (job: Job<JobParsingPayload>) => this.processJob(job),
      {
        connection: this.connection,
        concurrency: envConfig.queueConcurrency,
        limiter: { max: 10, duration: 1000 }, // Rate limit: 10 jobs/sec
      }
    );

    this.worker.on('completed', (job) => {
      Logger.debug(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      Logger.error(`Job ${job?.id} failed:`, err);
      Sentry.captureException(err, {
        tags: { errorType: 'queue_job_failed' },
        extra: { jobId: job?.id, attempts: job?.attemptsMade },
      });
    });

    Logger.info(`Worker started (concurrency: ${envConfig.queueConcurrency})`);
  }

  /**
   * Stop the worker gracefully
   */
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      Logger.info('Worker stopped');
    }
    await this.queue.close();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }

  /**
   * Process a single job (called by worker)
   */
  private async processJob(job: Job<JobParsingPayload>): Promise<void> {
    const { telegramMessageId } = job.data;
    Logger.debug(`Processing job ${telegramMessageId}`, { attempt: job.attemptsMade + 1 });

    await this.jobService.createJobFromQueue({
      telegramMessageId,
      channelId: job.data.channelId,
      senderUserId: job.data.senderUserId,
      senderUsername: job.data.senderUsername,
      rawText: job.data.rawText,
      telegramMessageDate: new Date(job.data.telegramMessageDate),
    });
  }
}
