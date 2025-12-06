import { JobRepository } from './job.repository';
import { JobParserService } from './services/job-parser.service';
import { JobFilterOptions, JobFeedResponse, CreateJobDto } from './job.types';
import { UserRepository } from '@modules/user/user.repository';
import { Logger } from '@utils/logger';
import { NotFoundError } from '@utils/errors';
import { JOB_TITLES } from '@shared/constants/job-titles';

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

  /**
   * Parse and save job synchronously
   * Used by scraper for bulk processing - validates with AI before saving
   */
  async createJobSync(data: CreateJobDto): Promise<void> {
    // Check if job already exists
    const existing = await this.jobRepository.findByMessageId(
      data.telegramMessageId
    );
    if (existing) {
      Logger.debug('Job already exists', { messageId: data.telegramMessageId });
      return;
    }

    try {
      // Parse FIRST with AI
      const parsedData = await this.jobParserService.parseJobText(data.rawText);

      // Only save if valid job
      if (parsedData) {
        await this.jobRepository.create({
          ...data,
          parsedData,
          status: 'parsed',
        });
        Logger.info('Job created and parsed', { channelId: data.channelId });
      } else {
        Logger.debug('Message is not a job, skipped', {
          channelId: data.channelId,
          previewText: data.rawText.substring(0, 50),
        });
      }
    } catch (error) {
      // On error, don't save - just log
      Logger.error('Failed to parse message', {
        channelId: data.channelId,
        error,
        previewText: data.rawText.substring(0, 50),
      });
      // Don't throw - continue processing other messages
    }
  }

  async getJobFeed(
    options: JobFilterOptions,
    userId?: string
  ): Promise<JobFeedResponse> {
    // CRITICAL: Enforce subscription filtering
    let channelIds: string[] | undefined = options.channelIds;

    if (userId) {
      const user = await this.userRepository.findById(userId);
      if (user) {
        // Override channelIds with user's subscriptions
        channelIds = user.subscribedChannels;

        // Read-time enforcement: free users limited to first 5 channels
        const MAX_FREE_CHANNELS = 5;
        if (user.plan === 'free' && channelIds.length > MAX_FREE_CHANNELS) {
          // Downgrade protection: preserve all channels, but only query first 5
          channelIds = channelIds.slice(0, MAX_FREE_CHANNELS);
          Logger.info(
            `Free user ${userId} has ${user.subscribedChannels.length} channels, limiting feed to first ${MAX_FREE_CHANNELS}`
          );
        } else {
          Logger.info(`Filtering feed for user ${userId}`, {
            channelCount: channelIds.length,
          });
        }
      }
    }

    const { jobs, total } = await this.jobRepository.findWithFilters({
      ...options,
      channelIds,
    });

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
        telegramMessageId: job.telegramMessageId,
        channelUsername: job.channelUsername,
        senderUserId: job.senderUserId,
        senderUsername: job.senderUsername,
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
    const job = await this.jobRepository.findByIdWithChannel(id);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return {
      id: job._id,
      channelId: job.channelId,
      telegramMessageId: job.telegramMessageId,
      channelUsername: job.channelUsername,
      senderUserId: job.senderUserId,
      senderUsername: job.senderUsername,
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
        // Not a job posting - delete it
        await this.jobRepository.deleteById(jobId);
        Logger.debug('Message is not a job posting, deleted', { jobId });
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

  async searchSkills(query: string = ''): Promise<string[]> {
    // Common tech skills list
    const TECH_SKILLS = [
      'React',
      'Vue.js',
      'Angular',
      'Next.js',
      'Nuxt.js',
      'Svelte',
      'TypeScript',
      'JavaScript',
      'HTML5',
      'CSS3',
      'Tailwind CSS',
      'Bootstrap',
      'Material-UI',
      'Redux',
      'MobX',
      'GraphQL',
      'REST API',
      'Webpack',
      'Vite',
      'Node.js',
      'Express.js',
      'NestJS',
      'Python',
      'Django',
      'Flask',
      'FastAPI',
      'Java',
      'Spring Boot',
      'Go',
      'Rust',
      'PHP',
      'Laravel',
      'Electron',
      'Ruby',
      'Ruby on Rails',
      '.NET',
      'C#',
      'ASP.NET',
      'React Native',
      'Flutter',
      'Swift',
      'Kotlin',
      'iOS',
      'Android',
      'Xamarin',
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'Redis',
      'Elasticsearch',
      'DynamoDB',
      'Cassandra',
      'Oracle',
      'SQL Server',
      'AWS',
      'Azure',
      'Google Cloud',
      'Docker',
      'Kubernetes',
      'Jenkins',
      'GitLab CI',
      'GitHub Actions',
      'Terraform',
      'Ansible',
      'CI/CD',
      'Linux',
      'Nginx',
      'Machine Learning',
      'TensorFlow',
      'PyTorch',
      'Pandas',
      'NumPy',
      'Scikit-learn',
      'Data Science',
      'Big Data',
      'Spark',
      'Hadoop',
      'Git',
      'Agile',
      'Scrum',
      'Microservices',
      'Blockchain',
      'Solidity',
      'Web3',
      'ChatGPT',
      'OpenAI',
      'Figma',
      'Adobe XD',
      'UX Design',
      'UI Design',
      'Elixir',
      'Nexus',
      'Linux Kernel',
      'NestJS',
    ].sort();

    if (!query || query.trim() === '') {
      return TECH_SKILLS.slice(0, 20); // Return first 20 skills
    }

    const lowerQuery = query.toLowerCase();
    return TECH_SKILLS.filter((skill) =>
      skill.toLowerCase().includes(lowerQuery)
    ).slice(0, 20); // Limit to 20 results
  }

  async searchJobFunctions(query: string = ''): Promise<string[]> {
    if (!query || query.trim() === '') {
      return JOB_TITLES.slice(0, 20); // Return first 20 titles
    }

    const lowerQuery = query.toLowerCase();
    return JOB_TITLES.filter((title) =>
      title.toLowerCase().includes(lowerQuery)
    ).slice(0, 20); // Limit to 20 results
  }
}
