import { Channel } from '@modules/channel/channel.model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration008: Migration = {
  version: 8,
  name: 'reset-last-scraped-message-id',

  async up() {
    Logger.info(
      'Running migration 008: Reset lastScrapedMessageId for all channels'
    );

    try {
      // Remove lastScrapedMessageId from all channels to force full 7-day rescrape
      const result = await Channel.updateMany(
        { lastScrapedMessageId: { $exists: true } },
        { $unset: { lastScrapedMessageId: '' } }
      );

      Logger.info(
        `Migration 008 completed: Reset lastScrapedMessageId for ${result.modifiedCount} channels`
      );
    } catch (error) {
      Logger.error('Migration 008 failed', error);
      throw error;
    }
  },

  async down() {
    Logger.info(
      'Rolling back migration 008: No action needed (lastScrapedMessageId will be repopulated by scraper)'
    );

    // No rollback needed - the scraper will naturally repopulate this field
    Logger.info('Migration 008 rollback completed (no-op)');
  },
};
