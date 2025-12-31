import { Channel } from '@modules/channel/channel.model';
import { Job } from '@modules/job/job.model';
import { User } from '@modules/user/user.model';
import { Logger } from '@utils/logger';

import { Migration } from '../types';

export const migration002: Migration = {
  version: 2,
  name: 'update-schemas-defaults',

  async up() {
    Logger.info('Running migration 002: Update schemas with default values');

    // 1. Update Users
    Logger.info('Updating User schema defaults...');
    await User.updateMany(
      {
        $or: [
          { hasCompletedOnboarding: { $exists: false } },
          { subscribedChannels: { $exists: false } },
        ],
      },
      {
        $setOnInsert: {
          hasCompletedOnboarding: false,
          subscribedChannels: [],
        },
      }
    );
    // Note: $setOnInsert only works on upsert, but here we want to set if missing.
    // Correct approach for existing docs: use $set if field is missing.
    // But we can't conditionally set different fields in one updateMany easily if we want to be precise,
    // unless we just set them if they are missing.
    // Actually, updateMany with $set will overwrite if we are not careful, but we want to set only if missing.
    // A better way is to run separate updates for each field or use pipeline updates (MongoDB 4.2+).

    // Using pipeline for atomic conditional update
    const userUpdateResult = await User.updateMany({}, [
      {
        $set: {
          hasCompletedOnboarding: {
            $ifNull: ['$hasCompletedOnboarding', false],
          },
          subscribedChannels: {
            $ifNull: ['$subscribedChannels', []],
          },
        },
      },
    ]);
    Logger.info(`Updated Users: ${userUpdateResult.modifiedCount}`);

    // 2. Update Channels
    Logger.info('Updating Channel schema defaults...');
    const channelUpdateResult = await Channel.updateMany({}, [
      {
        $set: {
          isMonitored: {
            $ifNull: ['$isMonitored', true],
          },
        },
      },
    ]);
    Logger.info(`Updated Channels: ${channelUpdateResult.modifiedCount}`);

    // 3. Update Jobs
    Logger.info('Updating Job schema defaults...');
    const jobUpdateResult = await Job.updateMany({}, [
      {
        $set: {
          status: {
            $ifNull: ['$status', 'pending_parse'],
          },
        },
      },
    ]);
    Logger.info(`Updated Jobs: ${jobUpdateResult.modifiedCount}`);

    Logger.info('Migration 002 completed');
  },

  async down() {
    Logger.info('Rolling back migration 002 (No-op as these are default values)');
    // We generally don't want to remove these fields as they are part of the schema now.
    // But strictly speaking, down should revert changes.
    // Since these are defaults, reverting would mean unsetting them, which might break things if code relies on them.
    // So we'll leave it as no-op or just log.
  },
};
