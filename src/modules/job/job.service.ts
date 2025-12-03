import { JobRepository } from './job.repository';
import { JobParserService } from './services/job-parser.service';
import { JobFilterOptions, JobFeedResponse, CreateJobDto } from './job.types';
import { UserRepository } from '@modules/user/user.repository';
import { Logger } from '@utils/logger';
import { NotFoundError } from '@utils/errors';

export class JobService {
  private jobRepository: JobRepository;
  private jobParserService: JobParserService;
  private userRepository: UserRepository;

  constructor() {
    this.jobRepository = new JobRepository();
    this.jobParserService = new JobParserService();
    this.userRepository = new UserRepository();
  }

  async createJob(data: CreateJobDto): Promise<void> {
    // Check if job already exists
    const existing = await this.jobRepository.findByMessageId(
      data.telegramMessageId
    );
    if (existing) {
      Logger.debug('Job already exists', { messageId: data.telegramMessageId });
      return;
    }

    // Create job with pending status
    const job = await this.jobRepository.create({
      ...data,
      status: 'pending_parse',
    });

    Logger.info('New job created', {
      jobId: job._id,
      channelId: data.channelId,
    });

    // Trigger parsing asynchronously
    this.parseJobAsync(job._id.toString(), data.rawText);
  }

  async getJobFeed(
    options: JobFilterOptions,
    userId?: string
  ): Promise<JobFeedResponse> {
    const { jobs, total } = await this.jobRepository.findWithFilters(options);

    // Get user's viewed jobs if userId provided
    let viewedJobs: string[] = [];
    if (userId) {
      const user = await this.userRepository.findById(userId);
      viewedJobs = user?.viewedJobs || [];
    }

    return {
      jobs: jobs.map((job: any) => ({
        id: job._id,
        channelId: job.channelId,
        parsedData: job.parsedData,
        createdAt: job.createdAt,
        isVisited: viewedJobs.includes(job._id.toString()),
      })),
      total,
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
  }

  async getJobById(id: string): Promise<any> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return {
      id: job._id,
      channelId: job.channelId,
      rawText: job.rawText,
      parsedData: job.parsedData,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  private async parseJobAsync(jobId: string, rawText: string): Promise<void> {
    try {
      const parsedData = await this.jobParserService.parseJobText(rawText);

      if (parsedData) {
        await this.jobRepository.updateById(jobId, {
          parsedData,
          status: 'parsed',
        });
        Logger.info('Job parsed successfully', { jobId });
      } else {
        // Not a job posting
        await this.jobRepository.updateById(jobId, {
          status: 'failed',
        });
        Logger.debug('Message is not a job posting', { jobId });
      }
    } catch (error) {
      Logger.error('Failed to parse job', { jobId, error });
      await this.jobRepository.updateById(jobId, {
        status: 'failed',
      });
    }
  }

  async processPendingJobs(): Promise<void> {
    const pendingJobs = await this.jobRepository.findPendingJobs();
    Logger.info(`Processing ${pendingJobs.length} pending jobs`);

    for (const job of pendingJobs) {
      await this.parseJobAsync(job._id.toString(), job.rawText);
    }
  }

  async markJobAsViewed(userId: string, jobId: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if job exists
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Add to viewedJobs if not already viewed
      if (!user.viewedJobs.includes(jobId)) {
        await this.userRepository.update(userId, {
          viewedJobs: [...user.viewedJobs, jobId],
        });
        Logger.info('Job marked as viewed', { userId, jobId });
      }
    } catch (error) {
      Logger.error('Failed to mark job as viewed', { userId, jobId, error });
      throw error;
    }
  }
}
