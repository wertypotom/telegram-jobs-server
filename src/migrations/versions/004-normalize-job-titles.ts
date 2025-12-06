import { Job } from '@modules/job/job.model';
import { JobParserService } from '@modules/job/services/job-parser.service';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration004: Migration = {
  version: 4,
  name: 'normalize-job-titles',

  async up() {
    Logger.info(
      'Running migration 004: Normalize job titles for multilingual filtering'
    );

    const parser = new JobParserService();
    const CONCURRENT_REQUESTS = 5; // Process 5 jobs in parallel

    // Find jobs without normalizedJobTitle
    const totalJobs = await Job.countDocuments({
      'parsedData.jobTitle': { $exists: true },
      'parsedData.normalizedJobTitle': { $exists: false },
    });

    Logger.info(`Found ${totalJobs} jobs to normalize`);

    if (totalJobs === 0) {
      Logger.info('No jobs to normalize. Migration complete!');
      return;
    }

    let processed = 0;
    let failed = 0;
    const batchSize = 100;
    let skip = 0;

    while (skip < totalJobs) {
      const jobs = await Job.find({
        'parsedData.jobTitle': { $exists: true },
        'parsedData.normalizedJobTitle': { $exists: false },
      })
        .skip(skip)
        .limit(batchSize);

      // Process jobs in chunks of CONCURRENT_REQUESTS
      for (let i = 0; i < jobs.length; i += CONCURRENT_REQUESTS) {
        const chunk = jobs.slice(i, i + CONCURRENT_REQUESTS);

        // Process chunk in parallel
        const results = await Promise.allSettled(
          chunk.map(async (job) => {
            if (!job.parsedData?.jobTitle) {
              throw new Error('Missing job title');
            }

            // Re-parse to get normalized title
            const parsed = await parser.parseJobText(job.rawText);

            if (parsed?.normalizedJobTitle) {
              job.parsedData.normalizedJobTitle = parsed.normalizedJobTitle;
            } else {
              // Fallback: use original title
              job.parsedData.normalizedJobTitle = job.parsedData.jobTitle;
              Logger.warn(`Used fallback for job ${job._id}`);
            }

            await job.save();
            return job._id;
          })
        );

        // Count successes and failures
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            processed++;
          } else {
            failed++;
            Logger.error(`Failed to normalize job:`, result.reason);
          }
        });

        if (processed % 50 === 0) {
          Logger.info(`Progress: ${processed}/${totalJobs}`);
        }

        // Small delay between chunks to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      skip += batchSize;
    }

    Logger.info(
      `Migration 004 complete: ${processed} normalized, ${failed} failed`
    );
  },

  async down() {
    Logger.info('Rolling back migration 004: Remove normalizedJobTitle field');

    // Remove normalizedJobTitle field from all jobs
    await Job.updateMany(
      { 'parsedData.normalizedJobTitle': { $exists: true } },
      { $unset: { 'parsedData.normalizedJobTitle': '' } }
    );

    Logger.info('normalizedJobTitle field removed from all jobs');
  },
};
