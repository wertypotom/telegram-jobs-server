import { Channel } from '@modules/channel/channel.model';
import { Logger } from '@utils/logger';

/**
 * Remove invalid channels from database
 */
export async function cleanupInvalidChannels(): Promise<void> {
  try {
    const invalidChannels = [
      '@remote_jobs_cis',
      '@react_jobs',
      '@python_jobs',
      '@devops_jobs',
    ];

    for (const username of invalidChannels) {
      const result = await Channel.deleteOne({ username });
      if (result.deletedCount > 0) {
        Logger.info(`Removed invalid channel: ${username}`);
      }
    }

    Logger.info('Invalid channels cleanup complete');
  } catch (error) {
    Logger.error('Failed to cleanup invalid channels:', error);
  }
}
