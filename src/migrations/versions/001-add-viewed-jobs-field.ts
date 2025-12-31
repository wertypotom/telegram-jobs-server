import { User } from '@modules/user/user.model';
import { Logger } from '@utils/logger';

import { Migration } from '../types';

export const migration001: Migration = {
  version: 1,
  name: 'add-viewed-jobs-field',

  async up() {
    Logger.info('Running migration 001: Add viewedJobs field to users');

    // Find all users without viewedJobs field
    const usersToUpdate = await User.find({
      $or: [{ viewedJobs: { $exists: false } }, { viewedJobs: null }],
    });

    Logger.info(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      Logger.info('No users need migration');
      return;
    }

    // Update users in bulk
    const bulkOps = usersToUpdate.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { viewedJobs: [] } },
      },
    }));

    const result = await User.bulkWrite(bulkOps);

    Logger.info('Migration 001 completed', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  },

  async down() {
    Logger.info('Rolling back migration 001: Remove viewedJobs field');

    await User.updateMany({}, { $unset: { viewedJobs: '' } });

    Logger.info('Migration 001 rolled back');
  },
};
