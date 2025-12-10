import { User } from '@modules/user/user.model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration007: Migration = {
  version: 7,
  name: 'add-subscription-changes-field',

  async up() {
    Logger.info(
      'Running migration 007: Add subscriptionChanges field to users'
    );

    try {
      // Find users without subscriptionChanges field
      const result = await User.updateMany(
        { subscriptionChanges: { $exists: false } },
        {
          $set: {
            subscriptionChanges: {
              count: 0,
              lastResetDate: new Date(),
            },
          },
        }
      );

      Logger.info(
        `Migration 007 completed: Updated ${result.modifiedCount} users with subscriptionChanges field`
      );
    } catch (error) {
      Logger.error('Migration 007 failed', error);
      throw error;
    }
  },

  async down() {
    Logger.info(
      'Rolling back migration 007: Remove subscriptionChanges field from users'
    );

    try {
      const result = await User.updateMany(
        { subscriptionChanges: { $exists: true } },
        { $unset: { subscriptionChanges: '' } }
      );

      Logger.info(
        `Migration 007 rolled back: Removed subscriptionChanges from ${result.modifiedCount} users`
      );
    } catch (error) {
      Logger.error('Failed to rollback migration 007', error);
      throw error;
    }
  },
};
