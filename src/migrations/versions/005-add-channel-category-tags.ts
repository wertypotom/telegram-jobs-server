import mongoose from 'mongoose';
import { Channel } from '@modules/channel/channel.model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration005: Migration = {
  version: 5,
  name: 'add-channel-category-tags',

  async up() {
    Logger.info(
      'Running migration 002: Add category and tags fields to channels'
    );

    // Find all channels without category or tags fields
    const channelsToUpdate = await Channel.find({
      $or: [{ category: { $exists: false } }, { tags: { $exists: false } }],
    });

    Logger.info(`Found ${channelsToUpdate.length} channels to update`);

    if (channelsToUpdate.length === 0) {
      Logger.info('No channels need migration');
      return;
    }

    // Update channels in bulk - set default values
    const bulkOps = channelsToUpdate.map((channel) => ({
      updateOne: {
        filter: { _id: channel._id },
        update: {
          $set: {
            category: 'General IT', // Default category
            tags: [], // Empty tags array
          },
        },
      },
    }));

    const result = await Channel.bulkWrite(bulkOps);

    Logger.info('Migration 002 completed', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    Logger.warn(
      'IMPORTANT: Re-run channel seed to populate correct categories and tags'
    );
  },

  async down() {
    Logger.info('Rolling back migration 002: Remove category and tags fields');

    await Channel.updateMany(
      {},
      {
        $unset: {
          category: '',
          tags: '',
        },
      }
    );

    Logger.info('Migration 002 rolled back');
  },
};
