import { envConfig } from '@config/env.config';
import { JobService } from '@modules/job/job.service';
import * as Sentry from '@sentry/node';
import { Logger } from '@utils/logger';
import { NewMessage, NewMessageEvent } from 'telegram/events';

import { ChannelManagerService } from './services/channel-manager.service';
import { TelegramClientService } from './services/telegram-client.service';

export class TelegramService {
  private clientService: TelegramClientService;
  private channelManager: ChannelManagerService;
  private jobService: JobService;
  private isListening = false;

  constructor() {
    this.clientService = new TelegramClientService();
    this.channelManager = new ChannelManagerService();
    this.jobService = new JobService();
  }

  async start(): Promise<void> {
    try {
      // Check if Telegram credentials are configured
      if (!envConfig.telegramApiId || !envConfig.telegramApiHash) {
        Logger.warn('Telegram credentials not configured. Skipping Telegram listener.');
        return;
      }

      Logger.info('Starting Telegram listener service...');

      // Initialize client
      const client = await this.clientService.initialize();

      // Join default channels
      await this.channelManager.joinDefaultChannels(client);

      // Start listening for messages
      await this.startListening();

      Logger.info('Telegram listener service started successfully');
    } catch (error) {
      Logger.error('Failed to start Telegram service:', error);
      // Don't throw - allow app to continue without Telegram
    }
  }

  private async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    const client = await this.clientService.getClient();

    // Add event handler for new messages
    client.addEventHandler(this.handleNewMessage.bind(this), new NewMessage({}));

    this.isListening = true;
    Logger.info('Listening for new Telegram messages');
  }

  private async handleNewMessage(event: NewMessageEvent): Promise<void> {
    let channelId = 'unknown';
    let channelUsername = 'unknown';
    let messageId: number | undefined;

    try {
      const message = event.message;
      messageId = message.id;

      // Get message text
      const text = message.text || message.message;
      if (!text || text.trim().length === 0) {
        return;
      }

      // Get channel info
      const chat = await event.getChat();
      channelId = chat?.id?.toString() || 'unknown';
      channelUsername = (chat as any)?.username || channelId;

      Logger.debug('New Telegram message received', {
        channelId,
        channelUsername,
        messageId: message.id,
        textLength: text.length,
      });

      // Create job entry
      await this.jobService.createJob({
        telegramMessageId: `${channelId}_${message.id}`,
        channelId: channelUsername,
        rawText: text,
        telegramMessageDate: new Date((message as any).date * 1000), // Convert Unix timestamp to Date
      });
    } catch (error: any) {
      Logger.error('Error handling Telegram message:', error);

      // Check if duplicate key error (expected, set to info level)
      const isDuplicateKey = error?.message?.includes('E11000 duplicate key');

      Sentry.captureException(error, {
        level: isDuplicateKey ? 'info' : 'error',
        tags: {
          errorType: isDuplicateKey ? 'duplicate_job' : 'telegram_message_handler',
          channelId: channelId || 'unknown',
        },
        extra: {
          messageId,
          channelUsername,
          isDuplicateKey,
          errorMessage: error.message,
        },
      });
    }
  }

  async stop(): Promise<void> {
    await this.clientService.disconnect();
    this.isListening = false;
    Logger.info('Telegram listener service stopped');
  }

  async joinChannel(channelUsername: string): Promise<void> {
    const client = await this.clientService.getClient();
    await this.channelManager.joinChannel(client, channelUsername);
  }

  getSubscribedChannels(): string[] {
    return this.channelManager.getSubscribedChannels();
  }
}
