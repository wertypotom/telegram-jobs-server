import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { BadRequestError } from '@utils/errors';
import { UserRepository } from '@modules/user/user.repository';
import { JobService } from '@modules/job/job.service';
import { ChannelInfo, RecommendedChannel } from './channel.types';
import { recommendedChannels } from './channel.config';

export class ChannelService {
  private userRepository: UserRepository;
  private jobService: JobService;

  constructor() {
    this.userRepository = new UserRepository();
    this.jobService = new JobService();
  }

  /**
   * Check if message text likely contains a job posting
   * Uses Russian + English keywords to pre-filter before AI validation
   */
  private isLikelyJobPost(text: string): boolean {
    // Minimum length check - job posts are usually detailed
    if (!text || text.trim().length < 50) {
      return false;
    }

    const lowerText = text.toLowerCase();

    // Russian job keywords
    const russianKeywords = [
      'работа', 'вакансия', 'вакансии', 'ищем', 'требуется', 
      'нужен', 'нужна', 'разработчик', 'программист', 'developer',
      'зарплата', 'оплата', 'удаленно', 'remote', 'офис',
      'резюме', 'откликнуться', 'соискател', 'кандидат',
      'junior', 'middle', 'senior', 'fullstack', 'backend', 'frontend',
      'react', 'node', 'python', 'java', 'golang', 'php',
      'hiring', 'ищу работу', 'в команду', 'проект'
    ];

    // English job keywords
    const englishKeywords = [
      'hiring', 'job', 'position', 'vacancy', 'opening',
      'developer', 'engineer', 'programmer', 'looking for',
      'we need', 'we are hiring', 'join our team', 'apply',
      'salary', 'compensation', 'remote', 'full-time', 'part-time',
      'contract', 'freelance', 'resume', 'cv', 'candidate'
    ];

    const allKeywords = [...russianKeywords, ...englishKeywords];

    // Check if text contains at least one job keyword
    return allKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Get user's Telegram channels (dialogs)
   */
  async getUserChannels(userId: string): Promise<ChannelInfo[]> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.telegramSession) {
        throw new BadRequestError('User Telegram session not found');
      }

      // Create client with user's session
      const client = new TelegramClient(
        new StringSession(user.telegramSession),
        parseInt(envConfig.telegramApiId),
        envConfig.telegramApiHash,
        { connectionRetries: 5 }
      );

      await client.connect();

      // Get all dialogs (chats, channels, groups)
      const dialogs = await client.getDialogs({ limit: 100 });

      const channels: ChannelInfo[] = [];

      for (const dialog of dialogs) {
        const entity = dialog.entity;
        
        // Filter for channels only
        if ((entity as any).className === 'Channel') {
          const channel = entity as any;
          
          channels.push({
            username: channel.username || `channel_${channel.id}`,
            title: channel.title || 'Unknown Channel',
            description: channel.about,
            memberCount: channel.participantsCount,
            isJoined: true,
          });
        }
      }

      await client.disconnect();

      Logger.info(`Fetched ${channels.length} channels for user ${userId}`);
      return channels;
    } catch (error) {
      Logger.error('Failed to fetch user channels:', error);
      throw new BadRequestError('Failed to fetch your Telegram channels');
    }
  }

  /**
   * Get recommended job channels
   */
  getRecommendedChannels(): RecommendedChannel[] {
    return recommendedChannels;
  }

  /**
   * Search for Telegram channels
   */
  async searchChannels(userId: string, query: string): Promise<ChannelInfo[]> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.telegramSession) {
        throw new BadRequestError('User Telegram session not found');
      }

      const client = new TelegramClient(
        new StringSession(user.telegramSession),
        parseInt(envConfig.telegramApiId),
        envConfig.telegramApiHash,
        { connectionRetries: 5 }
      );

      await client.connect();

      // Search for channels
      const result = await client.invoke(
        new (require('telegram/tl').Api.contacts.Search)({
          q: query,
          limit: 20,
        })
      );

      const channels: ChannelInfo[] = [];

      for (const chat of result.chats) {
        if ((chat as any).className === 'Channel') {
          const channel = chat as any;
          
          channels.push({
            username: channel.username || `channel_${channel.id}`,
            title: channel.title || 'Unknown Channel',
            description: channel.about,
            memberCount: channel.participantsCount,
            isJoined: false,
          });
        }
      }

      await client.disconnect();

      Logger.info(`Found ${channels.length} channels for query: ${query}`);
      return channels;
    } catch (error) {
      Logger.error('Failed to search channels:', error);
      throw new BadRequestError('Failed to search Telegram channels');
    }
  }

  /**
   * Subscribe user to selected channels and fetch historical jobs
   */
  async subscribeToChannels(
    userId: string,
    channelUsernames: string[]
  ): Promise<{ success: boolean; jobsCount: number }> {
    try {
      Logger.info(`Subscribing user ${userId} to channels:`, channelUsernames);
      
      const user = await this.userRepository.findById(userId);
      if (!user) {
        Logger.error(`User not found: ${userId}`);
        throw new BadRequestError('User not found');
      }
      
      if (!user.telegramSession) {
        Logger.error(`User ${userId} has no Telegram session`);
        throw new BadRequestError('User Telegram session not found');
      }

      // Update user's subscribed channels
      await this.userRepository.update(userId, {
        subscribedChannels: channelUsernames,
        hasCompletedOnboarding: true,
      });

      Logger.info(`Updated user ${userId} subscriptions and onboarding status`);

      // Fetch historical jobs from last 24 hours
      const jobsCount = await this.fetchHistoricalJobs(user.telegramSession, channelUsernames);

      Logger.info(`User ${userId} subscribed to ${channelUsernames.length} channels, fetched ${jobsCount} jobs`);

      return { success: true, jobsCount };
    } catch (error) {
      Logger.error('Failed to subscribe to channels:', {
        userId,
        channelUsernames,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Fetch messages from last 24 hours from channels
   */
  private async fetchHistoricalJobs(
    sessionString: string,
    channelUsernames: string[]
  ): Promise<number> {
    try {
      const client = new TelegramClient(
        new StringSession(sessionString),
        parseInt(envConfig.telegramApiId),
        envConfig.telegramApiHash,
        { connectionRetries: 5 }
      );

      await client.connect();

      let totalJobs = 0;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const channelUsername of channelUsernames) {
        try {
          // Get channel entity
          const channel = await client.getEntity(channelUsername);

          // Fetch messages from last 24 hours
          const messages = await client.getMessages(channel, {
            limit: 100,
            offsetDate: Math.floor(oneDayAgo.getTime() / 1000),
          });

          // Process each message
          for (const message of messages) {
            const text = message.text || message.message;
            if (!text || text.trim().length === 0) {
              continue;
            }

            // Pre-filter: Skip messages that don't look like job posts
            if (!this.isLikelyJobPost(text)) {
              Logger.debug(`Skipped non-job message from ${channelUsername}`, {
                messageId: message.id,
                preview: text.substring(0, 50)
              });
              continue;
            }

            // Create job entry (AI validation happens async in JobService)
            await this.jobService.createJob({
              telegramMessageId: `${channelUsername}_${message.id}`,
              channelId: channelUsername,
              rawText: text,
            });

            totalJobs++;
          }

          Logger.info(`Fetched ${messages.length} messages from ${channelUsername}`);
        } catch (error) {
          Logger.warn(`Failed to fetch messages from ${channelUsername}:`, error);
        }
      }

      await client.disconnect();

      return totalJobs;
    } catch (error) {
      Logger.error('Failed to fetch historical jobs:', error);
      return 0;
    }
  }

  /**
   * Get user's currently subscribed channels
   */
  async getSubscribedChannels(userId: string): Promise<string[]> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      return user.subscribedChannels || [];
    } catch (error) {
      Logger.error('Failed to get subscribed channels:', error);
      throw error;
    }
  }

  /**
   * Add new channels to existing subscriptions and fetch historical jobs
   */
  async addChannels(
    userId: string,
    newChannelUsernames: string[]
  ): Promise<{ success: boolean; jobsCount: number; totalChannels: number }> {
    try {
      Logger.info(`Adding channels for user ${userId}:`, newChannelUsernames);
      
      const user = await this.userRepository.findById(userId);
      if (!user) {
        Logger.error(`User not found: ${userId}`);
        throw new BadRequestError('User not found');
      }
      
      if (!user.telegramSession) {
        Logger.error(`User ${userId} has no Telegram session`);
        throw new BadRequestError('User Telegram session not found');
      }

      // Get existing subscriptions
      const existingChannels = user.subscribedChannels || [];
      
      // Filter out channels that are already subscribed
      const channelsToAdd = newChannelUsernames.filter(
        channel => !existingChannels.includes(channel)
      );

      if (channelsToAdd.length === 0) {
        Logger.info(`No new channels to add for user ${userId}`);
        return { 
          success: true, 
          jobsCount: 0,
          totalChannels: existingChannels.length 
        };
      }

      // Append new channels to existing subscriptions
      const updatedChannels = [...existingChannels, ...channelsToAdd];
      await this.userRepository.update(userId, {
        subscribedChannels: updatedChannels,
      });

      Logger.info(`Updated user ${userId} subscriptions with ${channelsToAdd.length} new channels`);

      // Fetch historical jobs only from newly added channels
      const jobsCount = await this.fetchHistoricalJobs(user.telegramSession, channelsToAdd);

      Logger.info(`User ${userId} added ${channelsToAdd.length} channels, fetched ${jobsCount} jobs`);

      return { 
        success: true, 
        jobsCount,
        totalChannels: updatedChannels.length 
      };
    } catch (error) {
      Logger.error('Failed to add channels:', {
        userId,
        newChannelUsernames,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
