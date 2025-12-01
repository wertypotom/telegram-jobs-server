/**
 * Migration: Add viewedJobs field to existing users
 * 
 * This script adds the viewedJobs array field to all existing users
 * who don't have it yet.
 * 
 * Usage: node dist/migrations/add-viewed-jobs-field.js
 */

import mongoose from 'mongoose';
import { envConfig } from '@config/env.config';
import { User } from '@modules/user/user.model';
import { Logger } from '@utils/logger';

async function runMigration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(envConfig.mongodbUri);
    Logger.info('Connected to MongoDB');

    // Find all users without viewedJobs field or with null/undefined viewedJobs
    const usersToUpdate = await User.find({
      $or: [
        { viewedJobs: { $exists: false } },
        { viewedJobs: null },
      ],
    });

    Logger.info(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      Logger.info('No users need migration');
      await mongoose.disconnect();
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
    
    Logger.info('Migration completed successfully', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    // Verify migration
    const remainingUsers = await User.countDocuments({
      $or: [
        { viewedJobs: { $exists: false } },
        { viewedJobs: null },
      ],
    });

    if (remainingUsers === 0) {
      Logger.info('✅ All users now have viewedJobs field');
    } else {
      Logger.warn(`⚠️ ${remainingUsers} users still missing viewedJobs field`);
    }

    await mongoose.disconnect();
    Logger.info('Disconnected from MongoDB');
  } catch (error) {
    Logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
