import { Logger } from '@utils/logger';
import { Api, TelegramClient } from 'telegram';

import { defaultChannels } from '../config/channels.config';

export class ChannelManagerService {
  private subscribedChannels: Set<string> = new Set();

  constructor() {
    // Initialize with default channels
    defaultChannels.forEach((channel) => this.subscribedChannels.add(channel));
  }

  async joinChannel(client: TelegramClient, channelUsername: string): Promise<void> {
    try {
      // Ensure username starts with @
      const username = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;

      // Join the channel
      await client.invoke(
        new Api.channels.JoinChannel({
          channel: username,
        })
      );

      this.subscribedChannels.add(username);
      Logger.info('Joined Telegram channel', { channel: username });
    } catch (error) {
      Logger.error('Failed to join channel:', {
        channel: channelUsername,
        error,
      });
      throw error;
    }
  }

  async joinDefaultChannels(client: TelegramClient): Promise<void> {
    Logger.info(`Joining ${defaultChannels.length} default channels`);

    for (const channel of defaultChannels) {
      try {
        await this.joinChannel(client, channel);
      } catch (error) {
        Logger.warn(`Failed to join default channel: ${channel}`, error);
      }
    }
  }

  getSubscribedChannels(): string[] {
    return Array.from(this.subscribedChannels);
  }

  isSubscribed(channelUsername: string): boolean {
    return this.subscribedChannels.has(channelUsername);
  }
}
