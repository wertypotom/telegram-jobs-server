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

  // Performance Configuration (tunable)
  private readonly SCRAPE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes (was 10)
  private readonly CHANNEL_CONCURRENCY = 3; // Scrape 3 channels simultaneously (was 5)
  private readonly MESSAGE_LIMIT = 500; // Fetch 500 messages per channel (was 100)
  private readonly AI_BATCH_SIZE = 10; // Process 10 jobs per AI batch (was 3)
  private readonly BATCH_DELAY_MS = 500; // Delay between AI batches (was 1000ms)

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
      Logger.info(
        `Processing in batches of ${this.CHANNEL_CONCURRENCY} channels`
      );

      let totalJobsFound = 0;
      const startTime = Date.now();

      // Process channels in parallel batches
      for (
        let i = 0;
        i < monitoredChannels.length;
        i += this.CHANNEL_CONCURRENCY
      ) {
        const channelBatch = monitoredChannels.slice(
          i,
          i + this.CHANNEL_CONCURRENCY
        );

        Logger.info(
          `Processing channel batch ${
            Math.floor(i / this.CHANNEL_CONCURRENCY) + 1
          }/${Math.ceil(
            monitoredChannels.length / this.CHANNEL_CONCURRENCY
          )} (${channelBatch.length} channels)`
        );

        // Scrape channels in parallel
        const results = await Promise.allSettled(
          channelBatch.map(async (channel) => {
            try {
              const { jobsFound, highestMessageId } = await this.scrapeChannel(
                channel.username,
                channel.lastScrapedAt,
                channel.lastScrapedMessageId
              );

              // Update last scraped timestamp and message ID
              await this.channelRepository.updateLastScraped(
                channel.username,
                highestMessageId
              );

              return { channel: channel.username, jobsFound };
            } catch (error) {
              Logger.error(
                `Failed to scrape channel ${channel.username}:`,
                error
              );
              return { channel: channel.username, jobsFound: 0 };
            }
          })
        );

        // Aggregate results
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            totalJobsFound += result.value.jobsFound;
          }
        });
      }

      const durationSec = Math.round((Date.now() - startTime) / 1000);
      Logger.info(
        `Scrape cycle complete in ${durationSec}s. Found ${totalJobsFound} potential jobs across ${monitoredChannels.length} channels.`
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
    lastScrapedAt?: Date,
    lastScrapedMessageId?: number
  ): Promise<{ jobsFound: number; highestMessageId?: number }> {
    try {
      const client = await this.telegramClient.getClient();

      // Get channel entity
      const channel = await client.getEntity(channelUsername);

      let messages;

      // Use message ID-based scraping if available (incremental)
      if (lastScrapedMessageId) {
        Logger.info(
          `Fetching messages after ID ${lastScrapedMessageId} from ${channelUsername}`
        );
        messages = await client.getMessages(channel, {
          limit: this.MESSAGE_LIMIT,
          minId: lastScrapedMessageId, // Only get messages newer than this
        });
      }
      // First time scraping or fallback - use time-based
      else {
        const offsetDate = lastScrapedAt
          ? Math.floor(lastScrapedAt.getTime() / 1000)
          : Math.floor((Date.now() - 3 * 24 * 60 * 60 * 1000) / 1000); // 3 days

        Logger.info(
          `First-time scrape or no message ID for ${channelUsername}, fetching last 3 days`
        );
        messages = await client.getMessages(channel, {
          limit: this.MESSAGE_LIMIT,
          offsetDate,
        });
      }

      Logger.info(
        `Fetched ${messages.length} messages from ${channelUsername}`
      );

      // Collect messages that pass pre-filter
      const validMessages: Array<{
        id: number;
        text: string;
        fromId?: any;
        sender?: any;
      }> = [];

      for (const message of messages) {
        const text = message.text || (message as any).message;

        if (!text || text.trim().length === 0) {
          continue;
        }

        // Pre-filter: Check if message looks like a job post
        if (!this.isLikelyJobPost(text)) {
          continue;
        }

        validMessages.push({
          id: message.id,
          text,
          fromId: (message as any).fromId,
          sender: (message as any).sender,
        });
      }

      Logger.info(
        `${validMessages.length} messages passed pre-filter in ${channelUsername}`
      );

      // Process in batches with AI parsing (increased for better throughput)
      const BATCH_SIZE = this.AI_BATCH_SIZE;
      let jobsFound = 0;

      for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
        const batch = validMessages.slice(i, i + BATCH_SIZE);

        // Process batch in parallel using Promise.allSettled
        const results = await Promise.allSettled(
          batch.map((msg) => {
            // Extract sender info
            const senderUserId =
              msg.fromId?.userId?.toString() ||
              msg.fromId?.toString() ||
              undefined;
            const senderUsername = msg.sender?.username || undefined;

            return this.jobService.createJobSync({
              telegramMessageId: `${channelUsername}_${msg.id}`,
              channelId: channelUsername,
              senderUserId,
              senderUsername,
              rawText: msg.text,
            });
          })
        );

        // Count successful jobs (createJobSync logs failures internally)
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            jobsFound++;
          } else {
            Logger.warn(
              `Batch job failed for message ${batch[idx].id}`,
              result.reason
            );
          }
        });

        // Add delay between batches to avoid overwhelming API
        if (i + BATCH_SIZE < validMessages.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.BATCH_DELAY_MS)
          );
        }
      }

      Logger.info(`Found ${jobsFound} potential jobs in ${channelUsername}`);

      // Find highest message ID from the batch
      const highestMessageId =
        validMessages.length > 0
          ? Math.max(...validMessages.map((m) => m.id))
          : undefined;

      return { jobsFound, highestMessageId };
    } catch (error: any) {
      // Handle Telegram FloodWait error (rate limiting)
      if (
        error?.message?.includes('FloodWaitError') ||
        error?.message?.includes('wait of')
      ) {
        const waitSeconds =
          error.message.match(/(\d+) seconds/)?.[1] || 'unknown';
        Logger.warn(
          `Rate limited on ${channelUsername}. Telegram requires waiting ${waitSeconds} seconds. Skipping for now.`
        );
        // Return 0 jobs but don't throw - allows scraper to continue
        return { jobsFound: 0 };
      }

      Logger.error(`Error scraping ${channelUsername}:`, error);
      throw error; // Re-throw other errors
    }
  }

  /**
   * Quick pre-filter to avoid unnecessary AI calls
   * Uses simple keyword matching - AI does final validation
   */
  private isLikelyJobPost(text: string): boolean {
    // Minimum length check
    if (!text || text.length < 50) {
      return false;
    }

    const lowerText = text.toLowerCase();

    // Top reliable keywords only (AI will do comprehensive validation)
    const jobKeywords = [
      'вакансия', // vacancy (RU)
      'hiring',
      'разработчик', // developer (RU)
      'developer',
      'требуется', // required (RU)
      'ищем', // looking for (RU)
      'position',
      'opening',
    ];

    // Exclude resumes/job seekers
    const excludeKeywords = ['#резюме', '#ищуработу', '#cv'];
    if (excludeKeywords.some((keyword) => lowerText.includes(keyword))) {
      return false;
    }

    // Must match at least 1 keyword (lowered from 2 since AI validates anyway)
    return jobKeywords.some((keyword) => lowerText.includes(keyword));
  }
}
