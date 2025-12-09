/**
 * Manual Job Cleanup Script
 *
 * Run this script manually to clean up old jobs:
 * node run-script.js src/scripts/cleanup-old-jobs.ts
 */

import { connectDatabase } from '../shared/config/database.config';
import { JobCleanupService } from '../modules/job/job-cleanup.service';
import { Logger } from '../shared/utils/logger';

async function main() {
  try {
    console.log('🧹 Starting manual job cleanup...\n');

    // Connect to database
    await connectDatabase();

    // Create cleanup service and run it
    const cleanupService = new JobCleanupService();
    await cleanupService.runCleanup();

    console.log('\n✅ Manual cleanup completed!\n');
    process.exit(0);
  } catch (error) {
    Logger.error('Manual cleanup failed:', error);
    process.exit(1);
  }
}

main();
