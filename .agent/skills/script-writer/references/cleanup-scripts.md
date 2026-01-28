# Cleanup Scripts

Patterns for deleting old records, archiving data, and maintenance tasks.

## Basic Cleanup Pattern

```typescript
import { connectDatabase, disconnectDatabase } from '@config/database.config';
import { Model } from '@modules/feature/model';
import { Logger } from '@utils/logger';

async function cleanupOldRecords() {
  try {
    Logger.info('🧹 Starting cleanup...');
    await connectDatabase();

    // Define threshold (e.g., 7 days ago)
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);

    const result = await Model.deleteMany({
      createdAt: { $lt: threshold },
    });

    Logger.info(`Deleted ${result.deletedCount} old records`);

    await disconnectDatabase();
    Logger.info('✅ Cleanup completed');
    process.exit(0);
  } catch (error) {
    Logger.error('Cleanup failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupOldRecords();
}

export { cleanupOldRecords };
```

## Cleanup with Service Integration

Use existing service for logic:

```typescript
import { JobCleanupService } from '@modules/job/job-cleanup.service';
import { connectDatabase } from '@config/database.config';
import { Logger } from '@utils/logger';

async function main() {
  try {
    console.log('🧹 Starting manual job cleanup...\n');

    await connectDatabase();

    // Use existing service
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
```

## Archive Instead of Delete

Move old records to archive collection:

```typescript
async function archiveOldJobs() {
  try {
    await connectDatabase();

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);

    const oldJobs = await Job.find({
      createdAt: { $lt: threshold },
    });

    Logger.info(`Found ${oldJobs.length} jobs to archive`);

    let archived = 0;
    let failed = 0;

    for (const job of oldJobs) {
      try {
        // Create archive record (lightweight)
        await ArchivedJob.create({
          telegramMessageId: job.messageId,
          channelId: job.channelId,
          parsedData: {
            jobTitle: job.parsedData?.jobTitle,
            company: job.parsedData?.company,
            techStack: job.parsedData?.techStack,
            level: job.parsedData?.level,
          },
          telegramMessageDate: job.createdAt,
          archivedAt: new Date(),
        });

        // Delete original
        await job.deleteOne();
        archived++;

        if (archived % 100 === 0) {
          Logger.info(`Progress: ${archived}/${oldJobs.length}`);
        }
      } catch (error) {
        Logger.error(`Failed to archive job ${job._id}:`, error);
        failed++;
      }
    }

    Logger.info(`Archive complete: ${archived} archived, ${failed} failed`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error('Archive failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}
```

## Conditional Cleanup

Clean based on multiple conditions:

```typescript
async function cleanupWithConditions() {
  try {
    await connectDatabase();

    // Cleanup: Old AND (failed OR incomplete)
    const result = await Model.deleteMany({
      $and: [
        { createdAt: { $lt: sevenDaysAgo } },
        {
          $or: [{ status: 'failed' }, { status: 'incomplete' }],
        },
      ],
    });

    Logger.info(`Deleted ${result.deletedCount} records`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error('Cleanup failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}
```

## Dry Run Mode

Preview what would be deleted:

```typescript
async function cleanupWithDryRun(dryRun = false) {
  try {
    await connectDatabase();

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);

    const recordsToDelete = await Model.find({
      createdAt: { $lt: threshold },
    });

    Logger.info(`Would delete ${recordsToDelete.length} records`);

    if (dryRun) {
      Logger.info('DRY RUN - No records deleted');
    } else {
      const result = await Model.deleteMany({
        createdAt: { $lt: threshold },
      });
      Logger.info(`Deleted ${result.deletedCount} records`);
    }

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error('Cleanup failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

// Run with: DRY_RUN=true npm run cleanup
const isDryRun = process.env.DRY_RUN === 'true';
cleanupWithDryRun(isDryRun);
```
