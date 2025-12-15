import { Job } from '@modules/job/job.model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration009: Migration = {
  version: 9,
  name: 'add-telegram-message-date',

  async up() {
    Logger.info('Running migration 009: Add telegramMessageDate field to jobs');

    try {
      // For existing jobs without telegramMessageDate, use createdAt as fallback
      // This is a reasonable approximation since most jobs were scraped shortly after posting
      const result = await Job.updateMany(
        { telegramMessageDate: { $exists: false } },
        [
          {
            $set: {
              telegramMessageDate: '$createdAt',
            },
          },
        ]
      );

      Logger.info(
        `Migration 009 completed: Added telegramMessageDate to ${result.modifiedCount} existing jobs (using createdAt as fallback)`
      );
    } catch (error) {
      Logger.error('Migration 009 failed', error);
      throw error;
    }
  },

  async down() {
    Logger.info(
      'Rolling back migration 009: Remove telegramMessageDate field from jobs'
    );

    try {
      const result = await Job.updateMany(
        { telegramMessageDate: { $exists: true } },
        { $unset: { telegramMessageDate: '' } }
      );

      Logger.info(
        `Migration 009 rolled back: Removed telegramMessageDate from ${result.modifiedCount} jobs`
      );
    } catch (error) {
      Logger.error('Failed to rollback migration 009', error);
      throw error;
    }
  },
};
