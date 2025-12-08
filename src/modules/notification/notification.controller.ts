import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@middlewares/auth.middleware';
import { ApiResponse } from '@utils/response';
import { UserRepository } from '@modules/user/user.repository';
import { Logger } from '@utils/logger';
import crypto from 'crypto';

export class NotificationController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * GET /api/notifications/settings
   * Get user's notification settings
   */
  getSettings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        ApiResponse.error(res, 'User not found', 404);
        return;
      }

      const settings = {
        enabled: user.notificationEnabled || false,
        subscribed: !!user.telegramChatId,
        telegramChatId: user.telegramChatId,
        filters: user.notificationFilters || {
          stack: [],
          level: [],
          jobFunction: [],
          locationType: [],
        },
        quietHours: user.quietHours || {
          enabled: false,
          startHour: 22,
          endHour: 8,
          timezone: 'America/New_York',
        },
        userId: user._id.toString(), // For bot subscription
      };

      ApiResponse.success(res, settings, 'Settings retrieved');
    } catch (error) {
      Logger.error('Get notification settings error:', error);
      next(error);
    }
  };

  /**
   * POST /api/notifications/settings
   * Update user's notification settings
   */
  updateSettings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const { enabled, filters, quietHours } = req.body;

      const updates: any = {};

      if (typeof enabled === 'boolean') {
        updates.notificationEnabled = enabled;
      }

      if (filters) {
        updates.notificationFilters = {
          stack: filters.stack || [],
          level: filters.level || [],
          jobFunction: filters.jobFunction || [],
          locationType: filters.locationType || [],
          experienceYears: filters.experienceYears,
        };
      }

      if (quietHours) {
        updates.quietHours = {
          enabled: quietHours.enabled || false,
          startHour: quietHours.startHour || 22,
          endHour: quietHours.endHour || 8,
          timezone: quietHours.timezone || 'America/New_York',
        };
      }

      await this.userRepository.update(userId, updates);
      Logger.info('Notification settings updated', { userId });

      // Send Telegram confirmation if enabled status changed
      if (typeof enabled === 'boolean') {
        const user = await this.userRepository.findById(userId);
        if (user?.telegramChatId) {
          const { TelegramBotService } = await import('./telegram-bot.service');
          const botService = TelegramBotService.getInstance();

          if (enabled) {
            await botService.sendMessage(
              user.telegramChatId,
              `
✅ Notifications Enabled!

You'll now receive job alerts when they match your filters.

Manage settings: https://jobsniper.com/settings/notifications
            `
            );
          } else {
            await botService.sendMessage(
              user.telegramChatId,
              `
⏸️ Notifications Paused

You won't receive job alerts until you resume.

Resume anytime from the web app or Telegram bot.
            `
            );
          }
        }
      }

      ApiResponse.success(res, null, 'Settings updated successfully');
    } catch (error) {
      Logger.error('Update notification settings error:', error);
      next(error);
    }
  };

  /**
   * POST /api/notifications/test
   * Send a test notification to verify setup
   */
  sendTestNotification = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const user = await this.userRepository.findById(userId);

      if (!user || !user.telegramChatId) {
        ApiResponse.error(res, 'Not subscribed to Telegram bot', 400);
        return;
      }

      // Send test notification
      const { TelegramBotService } = await import('./telegram-bot.service');
      const botService = TelegramBotService.getInstance();

      const testMessage = `
🧪 Test Notification

This is a test message from JobSniper!

If you're seeing this, your notifications are working perfectly! ✅

You'll receive alerts like this when new jobs match your filters.

Manage settings: https://jobsniper.com/settings/notifications
      `;

      await botService.sendMessage(user.telegramChatId, testMessage);
      Logger.info('Test notification sent', {
        userId,
        chatId: user.telegramChatId,
      });

      ApiResponse.success(res, null, 'Test notification sent to Telegram');
    } catch (error) {
      Logger.error('Send test notification error:', error);
      next(error);
    }
  };

  /**
   * POST /api/notifications/generate-link
   * Generate Telegram deep link for subscription
   */
  generateSubscriptionLink = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        ApiResponse.error(res, 'User not found', 404);
        return;
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');

      // Save token to user
      await this.userRepository.update(userId, {
        telegramSubscriptionToken: token,
      });

      // Create deep link
      const botUsername =
        process.env.TELEGRAM_BOT_USERNAME || 'jobsniper_v2_bot';
      const deepLink = `https://t.me/${botUsername}?start=${token}`;

      Logger.info('Generated subscription link', { userId });

      ApiResponse.success(
        res,
        { deepLink, token },
        'Subscription link generated'
      );
    } catch (error) {
      Logger.error('Generate subscription link error:', error);
      next(error);
    }
  };
}
