import { User } from '@modules/user/user.model';
import { IJob } from '@shared/types/common.types';
import { Logger } from '@utils/logger';

import { TelegramBotService } from './telegram-bot.service';

/**
 * NotificationService - Handles job matching and notification delivery
 */
export class NotificationService {
  private botService: TelegramBotService;

  constructor() {
    this.botService = TelegramBotService.getInstance();
  }

  /**
   * Find users whose filters match this job
   */
  async findMatchingUsers(job: IJob): Promise<any[]> {
    if (!job.parsedData) return [];

    try {
      // Get all users with notifications enabled
      const users = await User.find({
        notificationEnabled: true,
        telegramChatId: { $exists: true },
      });

      // Filter users whose preferences match the job
      const matchingUsers = users.filter((user) =>
        this.matchesFilters(job, user.notificationFilters)
      );

      Logger.info(`Found ${matchingUsers.length} matching users for job ${job._id}`);
      return matchingUsers;
    } catch (error) {
      Logger.error('Error finding matching users:', error);
      return [];
    }
  }

  /**
   * Check if job matches user's filters
   */
  private matchesFilters(job: IJob, filters: any): boolean {
    if (!filters || !job.parsedData) return true; // No filters = match all

    // Match tech stack
    if (filters.stack?.length) {
      const jobStack = job.parsedData.techStack || [];
      const hasMatchingStack = filters.stack.some((tech: string) =>
        jobStack.some((j) => j.toLowerCase().includes(tech.toLowerCase()))
      );
      if (!hasMatchingStack) return false;
    }

    // Match seniority level
    if (filters.level?.length) {
      const jobLevel = job.parsedData.level?.toLowerCase();
      if (!jobLevel) return false;

      const hasMatchingLevel = filters.level.some((level: string) =>
        jobLevel.includes(level.toLowerCase())
      );
      if (!hasMatchingLevel) return false;
    }

    // Match job function
    if (filters.jobFunction?.length) {
      const jobTitle = job.parsedData.normalizedJobTitle?.toLowerCase() || '';
      const hasMatchingFunction = filters.jobFunction.some((func: string) =>
        jobTitle.includes(func.toLowerCase())
      );
      if (!hasMatchingFunction) return false;
    }

    // Match location type
    if (filters.locationType?.length) {
      if (filters.locationType.includes('remote') && !job.parsedData.isRemote) {
        return false;
      }
      if (filters.locationType.includes('on-site') && job.parsedData.isRemote) {
        return false;
      }
    }

    // Match experience years
    if (filters.experienceYears) {
      const jobExp = job.parsedData.experienceYears;
      if (jobExp !== undefined) {
        if (filters.experienceYears.min && jobExp < filters.experienceYears.min) {
          return false;
        }
        if (filters.experienceYears.max && jobExp > filters.experienceYears.max) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if notification should be sent (rate limiting + quiet hours)
   */
  async canSendNotification(user: any): Promise<boolean> {
    // Check quiet hours
    if (user.quietHours?.enabled) {
      const now = new Date();
      const userHour = now.getHours(); // TODO: Convert to user's timezone

      const startHour = user.quietHours.startHour;
      const endHour = user.quietHours.endHour;

      // Handle overnight quiet hours (e.g., 22:00 - 08:00)
      if (startHour > endHour) {
        if (userHour >= startHour || userHour < endHour) {
          Logger.info(`User ${user._id} in quiet hours, skipping notification`);
          return false;
        }
      } else {
        // Normal daytime quiet hours
        if (userHour >= startHour && userHour < endHour) {
          Logger.info(`User ${user._id} in quiet hours, skipping notification`);
          return false;
        }
      }
    }

    // Check rate limit (10 notifications per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (
      user.lastNotificationSent &&
      user.lastNotificationSent > oneHourAgo &&
      user.notificationCount >= 10
    ) {
      Logger.warn(`User ${user._id} rate limited (${user.notificationCount}/10)`);
      return false;
    }

    // Reset counter if last notification was > 1 hour ago
    if (!user.lastNotificationSent || user.lastNotificationSent < oneHourAgo) {
      user.notificationCount = 0;
    }

    return true;
  }

  /**
   * Send notification to user
   */
  async notifyUser(user: any, job: IJob): Promise<void> {
    try {
      // Check if we can send notification
      if (!(await this.canSendNotification(user))) {
        return;
      }

      // Send via Telegram bot
      await this.botService.sendJobNotification(user.telegramChatId, job);

      // Update rate limiting counters
      user.notificationCount = (user.notificationCount || 0) + 1;
      user.lastNotificationSent = new Date();
      await user.save();

      Logger.info(`Notification sent to user ${user._id} for job ${job._id}`);
    } catch (error) {
      Logger.error(`Failed to notify user ${user._id}:`, error);
    }
  }

  /**
   * Process new job and notify matching users
   */
  async processNewJob(job: IJob): Promise<void> {
    if (job.status !== 'parsed') return;

    try {
      const matchingUsers = await this.findMatchingUsers(job);

      if (matchingUsers.length === 0) {
        Logger.info(`No matching users for job ${job._id}`);
        return;
      }

      // Send notifications (non-blocking)
      const notificationPromises = matchingUsers.map((user) => this.notifyUser(user, job));

      await Promise.allSettled(notificationPromises);

      Logger.info(`Processed ${matchingUsers.length} notifications for job ${job._id}`);
    } catch (error) {
      Logger.error('Error processing new job:', error);
    }
  }

  /**
   * Stop the bot service
   */
  async stop(): Promise<void> {
    await this.botService.stop();
  }
}
