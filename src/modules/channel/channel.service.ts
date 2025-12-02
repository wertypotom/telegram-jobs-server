import { Logger } from '@utils/logger';
import { BadRequestError } from '@utils/errors';
import { UserRepository } from '@modules/user/user.repository';
import { ChannelRepository } from './channel.repository';
import { TelegramClientService } from '@modules/telegram/services/telegram-client.service';
import { ChannelInfo, RecommendedChannel } from './channel.types';
import { recommendedChannels } from './channel.config';

/**
 * ChannelService - Service-Centric Implementation
 *
 * This service manages channel subscriptions WITHOUT user Telegram sessions.
 * The master Telegram account handles all scraping in the background.
 */
export class ChannelService {
  private userRepository: UserRepository;
  private channelRepository: ChannelRepository;
  private telegramClientService: TelegramClientService;

  constructor() {
    this.userRepository = new UserRepository();
    this.channelRepository = new ChannelRepository();
    this.telegramClientService = new TelegramClientService();
  }

  /**
   * Get list of all available channels (from DB)
   * These are channels the master account is monitoring
   */
  async getAvailableChannels(): Promise<ChannelInfo[]> {
    try {
      const channels = await this.channelRepository.findAll();

      return channels.map((channel) => ({
        username: channel.username,
        title: channel.title,
        description: channel.description,
        memberCount: channel.memberCount,
        isJoined: channel.isMonitored,
      }));
    } catch (error) {
      Logger.error('Failed to fetch available channels:', error);
      throw new BadRequestError('Failed to fetch available channels');
    }
  }

  /**
   * Get user's subscribed channels (from user.subscribedChannels)
   */
  async getUserChannels(userId: string): Promise<ChannelInfo[]> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      // Get channel details from DB
      const channels = await Promise.all(
        user.subscribedChannels.map((username) =>
          this.channelRepository.findByUsername(username)
        )
      );

      return channels
        .filter((channel) => channel !== null)
        .map((channel) => ({
          username: channel!.username,
          title: channel!.title,
          description: channel!.description,
          memberCount: channel!.memberCount,
          isJoined: true,
        }));
    } catch (error) {
      Logger.error('Failed to fetch user channels:', error);
      throw new BadRequestError('Failed to fetch user channels');
    }
  }

  /**
   * Get recommended job channels
   */
  getRecommendedChannels(): RecommendedChannel[] {
    return recommendedChannels;
  }

  /**
   * Search for Telegram channels using master account
   */
  async searchChannels(userId: string, query: string): Promise<ChannelInfo[]> {
    try {
      const client = await this.telegramClientService.getClient();

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

      Logger.info(`Found ${channels.length} channels for query: ${query}`);
      return channels;
    } catch (error) {
      Logger.error('Failed to search channels:', error);
      throw new BadRequestError('Failed to search Telegram channels');
    }
  }

  /**
   * Subscribe user to channels (DB only - no Telegram join)
   *
   * @param userId - User ID
   * @param channelUsernames - Array of channel usernames (e.g., ['@react_jobs'])
   */
  async subscribeToChannels(
    userId: string,
    channelUsernames: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      Logger.info(`Subscribing user ${userId} to channels:`, channelUsernames);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      // Validate channel limit (max 10 per user)
      if (channelUsernames.length > 10) {
        throw new BadRequestError('Cannot subscribe to more than 10 channels');
      }

      // Ensure channels exist in DB (add if new)
      for (const username of channelUsernames) {
        const existing = await this.channelRepository.findByUsername(username);
        if (!existing) {
          // Fetch channel info from Telegram and add to DB
          await this.addChannelToDatabase(username);
        }
      }

      // Update user's subscribed channels
      await this.userRepository.update(userId, {
        subscribedChannels: channelUsernames,
        hasCompletedOnboarding: true,
      });

      Logger.info(
        `User ${userId} subscribed to ${channelUsernames.length} channels`
      );

      return {
        success: true,
        message: `Subscribed to ${channelUsernames.length} channels`,
      };
    } catch (error) {
      Logger.error('Failed to subscribe to channels:', error);
      throw error;
    }
  }

  /**
   * Add new channels to user's subscription (DB only)
   */
  async addChannels(
    userId: string,
    newChannelUsernames: string[]
  ): Promise<{ success: boolean; totalChannels: number }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      const existingChannels = user.subscribedChannels || [];
      const channelsToAdd = newChannelUsernames.filter(
        (channel) => !existingChannels.includes(channel)
      );

      if (channelsToAdd.length === 0) {
        return { success: true, totalChannels: existingChannels.length };
      }

      const updatedChannels = [...existingChannels, ...channelsToAdd];

      // Validate limit
      if (updatedChannels.length > 10) {
        throw new BadRequestError(
          'Cannot subscribe to more than 10 channels total'
        );
      }

      // Ensure new channels exist in DB
      for (const username of channelsToAdd) {
        const existing = await this.channelRepository.findByUsername(username);
        if (!existing) {
          await this.addChannelToDatabase(username);
        }
      }

      await this.userRepository.update(userId, {
        subscribedChannels: updatedChannels,
      });

      Logger.info(`User ${userId} added ${channelsToAdd.length} new channels`);

      return {
        success: true,
        totalChannels: updatedChannels.length,
      };
    } catch (error) {
      Logger.error('Failed to add channels:', error);
      throw error;
    }
  }

  /**
   * Add a channel to the database (fetch info from Telegram)
   * Private helper method
   */
  private async addChannelToDatabase(username: string): Promise<void> {
    try {
      const client = await this.telegramClientService.getClient();
      const channel = await client.getEntity(username);
      const channelData = channel as any;

      await this.channelRepository.create({
        username,
        title: channelData.title || username,
        description: channelData.about,
        memberCount: channelData.participantsCount,
        isMonitored: true,
      } as any);

      Logger.info(`Added channel ${username} to database`);
    } catch (error) {
      Logger.warn(`Failed to add channel ${username} to database:`, error);
      // Create with minimal info if Telegram fetch fails
      await this.channelRepository.create({
        username,
        title: username,
        isMonitored: true,
      } as any);
    }
  }
}
