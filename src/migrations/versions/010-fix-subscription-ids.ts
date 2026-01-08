import { envConfig } from '@config/env.config';
import { lemonSqueezySetup, listSubscriptions } from '@lemonsqueezy/lemonsqueezy.js';
import { User } from '@modules/user/user.model';
import { Logger } from '@utils/logger';

import { Migration } from '../types';

export const migration010: Migration = {
  version: 10,
  name: 'fix-subscription-ids',

  async up() {
    Logger.info('Running migration 010: Fix lemonsqueezySubscriptionId for premium users');

    // Initialize LemonSqueezy (env vars loaded by migration runner)
    lemonSqueezySetup({ apiKey: envConfig.lemonsqueezyApiKey });

    try {
      // Find premium users with customer ID
      const premiumUsers = await User.find({
        plan: 'premium',
        lemonsqueezyCustomerId: { $exists: true, $ne: null },
      });

      Logger.info(`Found ${premiumUsers.length} premium users to check`);

      let updatedCount = 0;

      for (const user of premiumUsers) {
        // Fetch subscriptions from LemonSqueezy by user email
        const result = await listSubscriptions({
          filter: { userEmail: user.email },
        });

        if (result.error) {
          Logger.warn(
            `Error fetching subscriptions for user ${user.email}: ${result.error.message}`
          );
          continue;
        }

        const subscriptions = result.data?.data || [];
        if (subscriptions.length === 0) {
          Logger.warn(`No subscriptions found for user ${user.email}`);
          continue;
        }

        // Get active subscription or most recent
        const activeSubscription =
          subscriptions.find((sub) => sub.attributes.status === 'active') || subscriptions[0];

        const correctSubscriptionId = activeSubscription.id;

        if (user.lemonsqueezySubscriptionId !== correctSubscriptionId) {
          await User.findByIdAndUpdate(user._id, {
            lemonsqueezySubscriptionId: correctSubscriptionId,
          });
          Logger.info(
            `Updated user ${user.email}: ${user.lemonsqueezySubscriptionId} -> ${correctSubscriptionId}`
          );
          updatedCount++;
        }
      }

      Logger.info(
        `Migration 010 completed: Updated ${updatedCount} users with correct subscription IDs`
      );
    } catch (error) {
      Logger.error('Migration 010 failed', error);
      throw error;
    }
  },

  // No down() - this is a data fix, not reversible automatically
};
