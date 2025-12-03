import { User } from '@modules/user/user.model';
import { Channel } from '@modules/channel/channel.model';
import { Job } from '@modules/job/job.model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration003: Migration = {
  version: 3,
  name: 'restructure-job-schema',

  async up() {
    Logger.info(
      'Running migration 003: Restructure job schema with new fields'
    );

    // Update Jobs with new structure
    Logger.info('Updating Job schema with new fields...');

    // Jobs will automatically get new fields on next parse
    // We don't need to modify existing jobs as the schema is flexible
    // Old jobs will continue to work with old structure
    // New jobs will use new structure

    const jobCount = await Job.countDocuments();
    Logger.info(
      `${jobCount} jobs in database - new structure will apply to future jobs`
    );

    Logger.info('Migration 003 completed');
  },

  async down() {
    Logger.info(
      'Rolling back migration 003 (No-op - schema changes are backward compatible)'
    );
    // Schema changes are backward compatible
    // Old structure still works, just missing new fields
  },
};
