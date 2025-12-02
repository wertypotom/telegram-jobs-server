import { Channel } from '@modules/channel/channel.model';
import { Logger } from '@utils/logger';

/**
 * Default channels to monitor
 * These will be automatically added to the database on server start
 */
const DEFAULT_CHANNELS = [
  {
    username: '@job_for_juniors',
    title: 'Jobs for Juniors',
    description: 'Entry-level developer positions',
    isMonitored: true,
  },
  {
    username: '@javascript_jobs',
    title: 'JavaScript Jobs',
    description: 'JavaScript and TypeScript opportunities',
    isMonitored: true,
  },
  {
    username: '@nodejs_jobs',
    title: 'Node.js Jobs',
    description: 'Node.js backend positions',
    isMonitored: true,
  },
];

/**
 * Seed default channels into the database
 */
export async function seedDefaultChannels(): Promise<void> {
  try {
    Logger.info('Seeding default channels...');

    for (const channelData of DEFAULT_CHANNELS) {
      const existing = await Channel.findOne({
        username: channelData.username,
      });

      if (!existing) {
        await Channel.create(channelData);
        Logger.info(`Created channel: ${channelData.username}`);
      } else {
        Logger.info(`Channel already exists: ${channelData.username}`);
      }
    }

    Logger.info('Default channels seeded successfully');
  } catch (error) {
    Logger.error('Failed to seed default channels:', error);
    throw error;
  }
}
