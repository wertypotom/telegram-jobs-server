import { TelegramClientService } from '@modules/telegram/services/telegram-client.service';
import { ChannelRepository } from '@modules/channel/channel.repository';
import { JobService } from '@modules/job/job.service';
import { Logger } from '@utils/logger';

/**
 * ScraperService - Background job scraper
 *
 * Runs continuously to fetch new messages from monitored Telegram channels
 * and save them as jobs in the database.
 */
export class ScraperService {
  private telegramClient: TelegramClientService;
  private channelRepository: ChannelRepository;
  private jobService: JobService;
  private isRunning: boolean = false;
  private scrapeInterval: NodeJS.Timeout | null = null;
  private readonly SCRAPE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.telegramClient = new TelegramClientService();
    this.channelRepository = new ChannelRepository();
    this.jobService = new JobService();
  }

  /**
   * Start the background scraper
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      Logger.warn('Scraper is already running');
      return;
    }

    this.isRunning = true;
    Logger.info('Starting background scraper service');

    // Run immediately on start
    await this.scrapeAllChannels();

    // Then run every 10 minutes
    this.scrapeInterval = setInterval(async () => {
      await this.scrapeAllChannels();
    }, this.SCRAPE_INTERVAL_MS);

    Logger.info(
      `Scraper scheduled to run every ${
        this.SCRAPE_INTERVAL_MS / 1000 / 60
      } minutes`
    );
  }

  /**
   * Stop the background scraper
   */
  stop(): void {
    if (!this.isRunning) {
      Logger.warn('Scraper is not running');
      return;
    }

    if (this.scrapeInterval) {
      clearInterval(this.scrapeInterval);
      this.scrapeInterval = null;
    }

    this.isRunning = false;
    Logger.info('Background scraper stopped');
  }

  /**
   * Get scraper status
   */
  getStatus(): { isRunning: boolean; intervalMinutes: number } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.SCRAPE_INTERVAL_MS / 1000 / 60,
    };
  }

  /**
   * Scrape all monitored channels
   */
  private async scrapeAllChannels(): Promise<void> {
    try {
      Logger.info('Starting scrape cycle...');

      const monitoredChannels = await this.channelRepository.findMonitored();
      Logger.info(`Found ${monitoredChannels.length} monitored channels`);

      let totalJobsFound = 0;

      for (const channel of monitoredChannels) {
        try {
          const jobsFound = await this.scrapeChannel(
            channel.username,
            channel.lastScrapedAt
          );
          totalJobsFound += jobsFound;

          // Update last scraped timestamp
          await this.channelRepository.updateLastScraped(channel.username);
        } catch (error) {
          Logger.error(`Failed to scrape channel ${channel.username}:`, error);
        }
      }

      Logger.info(
        `Scrape cycle complete. Found ${totalJobsFound} potential jobs.`
      );
    } catch (error) {
      Logger.error('Scrape cycle failed:', error);
    }
  }

  /**
   * Scrape a single channel (can be called externally for immediate scraping)
   */
  async scrapeChannel(
    channelUsername: string,
    lastScrapedAt?: Date
  ): Promise<number> {
    try {
      const client = await this.telegramClient.getClient();

      // Get channel entity
      const channel = await client.getEntity(channelUsername);

      // Calculate offset date (fetch messages since last scrape, or last 24 hours)
      const offsetDate = lastScrapedAt
        ? Math.floor(lastScrapedAt.getTime() / 1000)
        : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

      // Fetch messages
      const messages = await client.getMessages(channel, {
        limit: 100,
        offsetDate,
      });

      Logger.info(
        `Fetched ${messages.length} messages from ${channelUsername}`
      );

      let jobsFound = 0;

      for (const message of messages) {
        const text = message.text || (message as any).message;

        if (!text || text.trim().length === 0) {
          continue;
        }

        // Pre-filter: Check if message looks like a job post
        if (!this.isLikelyJobPost(text)) {
          continue;
        }

        // Create job entry (AI parsing happens async in JobService)
        try {
          await this.jobService.createJob({
            telegramMessageId: `${channelUsername}_${message.id}`,
            channelId: channelUsername,
            rawText: text,
          });
          jobsFound++;
        } catch (error) {
          // Skip if job already exists (duplicate message ID)
          if ((error as any).code === 11000) {
            continue;
          }
          Logger.warn(`Failed to create job from ${channelUsername}:`, error);
        }
      }

      Logger.info(`Found ${jobsFound} potential jobs in ${channelUsername}`);
      return jobsFound;
    } catch (error) {
      Logger.error(`Error scraping ${channelUsername}:`, error);
      return 0;
    }
  }

  /**
   * Check if message text likely contains a job posting
   * Uses Russian + English keywords to pre-filter before AI validation
   */
  private isLikelyJobPost(text: string): boolean {
    // Minimum length check
    if (!text || text.trim().length < 50) {
      return false;
    }

    const lowerText = text.toLowerCase();

    // Job keywords (Russian + English)
    const jobKeywords = [
      // Russian
      'работа',
      'вакансия',
      'вакансии',
      'ищем',
      'требуется',
      'нужен',
      'нужна',
      'разработчик',
      'программист',
      'зарплата',
      'оплата',
      'удаленно',
      'офис',
      'резюме',
      'откликнуться',
      'соискател',
      'кандидат',
      'в команду',
      'проект',
      // English
      'hiring',
      'job',
      'position',
      'vacancy',
      'opening',
      'developer',
      'engineer',
      'programmer',
      'looking for',
      'we need',
      'we are hiring',
      'join our team',
      'apply',
      'salary',
      'compensation',
      'remote',
      'full-time',
      'part-time',
      'contract',
      'freelance',
      'resume',
      'cv',
      'candidate',
      // Tech levels
      'junior',
      'middle',
      'senior',
      'lead',
      // Tech stacks
      'react',
      'node',
      'python',
      'java',
      'golang',
      'php',
      'fullstack',
      'backend',
      'frontend',
    ];

    // Negative keywords (exclude resumes and job seekers)
    const negativeKeywords = [
      '#резюме',
      '#ищуработу',
      '#lookingforjob',
      '#cv',
      '#resume',
    ];

    // Check for negative keywords
    if (negativeKeywords.some((keyword) => lowerText.includes(keyword))) {
      return false;
    }

    // Check if text contains at least 2 job keywords
    const keywordMatches = jobKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    );

    return keywordMatches.length >= 2;
  }
}
