import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

export class TelegramClientService {
  private client: TelegramClient | null = null;
  private sessionPath = path.join(process.cwd(), 'telegram-session.json');

  async initialize(): Promise<TelegramClient> {
    if (this.client) {
      return this.client;
    }

    try {
      // Load session if exists
      const sessionString = await this.loadSession();
      const session = new StringSession(sessionString);

      // Create client
      this.client = new TelegramClient(
        session,
        parseInt(envConfig.telegramApiId),
        envConfig.telegramApiHash,
        {
          connectionRetries: 5,
        }
      );

      // Connect
      await this.client.connect();

      // Save session for future use
      const newSessionString = this.client.session.save() as unknown as string;
      await this.saveSession(newSessionString);

      Logger.info('Telegram client connected successfully');
      return this.client;
    } catch (error) {
      Logger.error('Failed to initialize Telegram client:', error);
      throw error;
    }
  }

  async getClient(): Promise<TelegramClient> {
    if (!this.client) {
      return await this.initialize();
    }
    return this.client;
  }

  private async loadSession(): Promise<string> {
    try {
      // First try environment variable
      if (envConfig.telegramSessionString) {
        return envConfig.telegramSessionString;
      }

      // Then try file
      const data = await fs.readFile(this.sessionPath, 'utf-8');
      const sessionData = JSON.parse(data);
      return sessionData.session || '';
    } catch {
      Logger.info('No existing session found, will create new one');
      return '';
    }
  }

  private async saveSession(sessionString: string): Promise<void> {
    try {
      await fs.writeFile(this.sessionPath, JSON.stringify({ session: sessionString }, null, 2));
      Logger.info('Telegram session saved');
    } catch (error) {
      Logger.error('Failed to save session:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      Logger.info('Telegram client disconnected');
    }
  }
}
