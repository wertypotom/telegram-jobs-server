import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { computeCheck } from 'telegram/Password';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { BadRequestError } from '@utils/errors';

interface PendingAuth {
  client: TelegramClient;
  phoneCodeHash: string;
  phoneNumber: string;
  timestamp: number;
}

export class TelegramAuthService {
  private pendingAuths: Map<string, PendingAuth> = new Map();
  private readonly AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up expired auth sessions every minute
    setInterval(() => this.cleanupExpiredAuths(), 60 * 1000);
  }

  async sendCode(phoneNumber: string): Promise<{ phoneCodeHash: string }> {
    try {
      // Create new client for this auth session
      const client = new TelegramClient(
        new StringSession(''),
        parseInt(envConfig.telegramApiId),
        envConfig.telegramApiHash,
        { connectionRetries: 5 }
      );

      await client.connect();

      // Send code
      const result = await client.sendCode(
        {
          apiId: parseInt(envConfig.telegramApiId),
          apiHash: envConfig.telegramApiHash,
        },
        phoneNumber
      );

      const phoneCodeHash = result.phoneCodeHash;

      // Store pending auth
      this.pendingAuths.set(phoneNumber, {
        client,
        phoneCodeHash,
        phoneNumber,
        timestamp: Date.now(),
      });

      Logger.info(`Telegram code sent to ${phoneNumber}`);

      return { phoneCodeHash };
    } catch (error: any) {
      Logger.error('Failed to send Telegram code:', error);
      throw new BadRequestError(
        error.message || 'Failed to send verification code'
      );
    }
  }

  async verifyCode(
    phoneNumber: string,
    code: string,
    password?: string
  ): Promise<{ sessionString: string; telegramUserId: string } | { requires2FA: true }> {
    const pendingAuth = this.pendingAuths.get(phoneNumber);

    if (!pendingAuth) {
      throw new BadRequestError(
        'No pending authentication found. Please request a new code.'
      );
    }

    try {
      const { client, phoneCodeHash } = pendingAuth;

      // Sign in with code
      await client.invoke(
        new (require('telegram/tl').Api.auth.SignIn)({
          phoneNumber,
          phoneCodeHash,
          phoneCode: code,
        })
      );

      // Get user info
      const me = await client.getMe();
      const telegramUserId = me.id.toString();

      // Get session string
      const sessionString = client.session.save() as unknown as string;

      // Clean up
      await client.disconnect();
      this.pendingAuths.delete(phoneNumber);

      Logger.info(`Telegram auth successful for ${phoneNumber}`);

      return { sessionString, telegramUserId };
    } catch (error: any) {
      Logger.error('Failed to verify Telegram code:', error);
      
      // Check if it's a 2FA error
      if (error.message && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        Logger.info(`2FA required for ${phoneNumber}`);
        // Don't clean up - keep client alive for password verification
        return { requires2FA: true };
      }

      // Clean up on other errors
      if (pendingAuth.client) {
        await pendingAuth.client.disconnect();
      }
      this.pendingAuths.delete(phoneNumber);

      throw new BadRequestError(
        error.message || 'Invalid verification code'
      );
    }
  }

  async verify2FAPassword(
    phoneNumber: string,
    password: string
  ): Promise<{ sessionString: string; telegramUserId: string }> {
    const pendingAuth = this.pendingAuths.get(phoneNumber);

    if (!pendingAuth) {
      throw new BadRequestError(
        'No pending authentication found. Please request a new code.'
      );
    }

    try {
      const { client } = pendingAuth;

      // Get password info
      const passwordInfo = await client.invoke(
        new (require('telegram/tl').Api.account.GetPassword)()
      );

      // Compute SRP check using helper function
      const passwordCheck = await computeCheck(passwordInfo, password);

      // Check password
      await client.invoke(
        new (require('telegram/tl').Api.auth.CheckPassword)({
          password: passwordCheck,
        })
      );

      // Get user info
      const me = await client.getMe();
      const telegramUserId = me.id.toString();

      // Get session string
      const sessionString = client.session.save() as unknown as string;

      // Clean up
      await client.disconnect();
      this.pendingAuths.delete(phoneNumber);

      Logger.info(`Telegram 2FA auth successful for ${phoneNumber}`);

      return { sessionString, telegramUserId };
    } catch (error: any) {
      Logger.error('Failed to verify 2FA password:', error);
      
      // Clean up on error
      if (pendingAuth.client) {
        await pendingAuth.client.disconnect();
      }
      this.pendingAuths.delete(phoneNumber);

      throw new BadRequestError(
        error.message || 'Invalid 2FA password'
      );
    }
  }

  private cleanupExpiredAuths(): void {
    const now = Date.now();
    for (const [phoneNumber, auth] of this.pendingAuths.entries()) {
      if (now - auth.timestamp > this.AUTH_TIMEOUT) {
        auth.client.disconnect().catch(() => {});
        this.pendingAuths.delete(phoneNumber);
        Logger.debug(`Cleaned up expired auth for ${phoneNumber}`);
      }
    }
  }
}
