import { Job } from '@modules/job/job.model';
import { Logger } from '@utils/logger';

import { Migration } from '../types';

export const migration006: Migration = {
  version: 6,
  name: 'add-job-text-index',

  async up() {
    Logger.info('Running migration 003: Add text index to Job collection');

    try {
      // Drop existing text index if it exists (to avoid conflicts)
      const indexes = await Job.collection.getIndexes();
      const textIndexName = Object.keys(indexes).find((name) =>
        indexes[name].some((idx: any) => idx[1] === 'text')
      );

      if (textIndexName) {
        Logger.info(`Dropping existing text index: ${textIndexName}`);
        await Job.collection.dropIndex(textIndexName);
      }

      // Create compound text index for search
      await Job.collection.createIndex(
        {
          rawText: 'text',
          'parsedData.jobTitle': 'text',
          'parsedData.description': 'text',
        },
        {
          name: 'job_text_search_idx',
          weights: {
            rawText: 1,
            'parsedData.jobTitle': 3, // Higher weight for job title
            'parsedData.description': 2, // Medium weight for description
          },
          default_language: 'english',
        }
      );

      Logger.info('Migration 003 completed: Text index created successfully');
    } catch (error) {
      Logger.error('Migration 003 failed', error);
      throw error;
    }
  },

  async down() {
    Logger.info('Rolling back migration 003: Remove text index from Job collection');

    try {
      await Job.collection.dropIndex('job_text_search_idx');
      Logger.info('Migration 003 rolled back: Text index dropped');
    } catch (error) {
      Logger.error('Failed to drop text index', error);
      throw error;
    }
  },
};
