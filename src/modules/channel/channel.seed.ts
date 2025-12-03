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
  {
    username: '@frontend_jobs',
    title: 'Frontend Jobs',
    description: 'Frontend developer opportunities',
    isMonitored: true,
  },
  {
    username: '@backend_jobs',
    title: 'Backend Jobs',
    description: 'Backend developer positions',
    isMonitored: true,
  },
  {
    username: '@fullstack_jobs',
    title: 'Fullstack Jobs',
    description: 'Fullstack developer roles',
    isMonitored: true,
  },
  {
    username: '@remotework',
    title: 'Remote Work',
    description: 'Remote developer and IT jobs',
    isMonitored: true,
  },
  {
    username: '@job_react',
    title: 'React Jobs',
    description: 'React and React Native positions',
    isMonitored: true,
  },
  {
    username: '@python_jobs',
    title: 'Python Jobs',
    description: 'Python developer opportunities',
    isMonitored: true,
  },
  {
    username: '@devops_jobs',
    title: 'DevOps Jobs',
    description: 'DevOps and infrastructure roles',
    isMonitored: true,
  },
  {
    username: '@remote_developers',
    title: 'Remote Developers',
    description: 'Remote positions for developers',
    isMonitored: true,
  },
  {
    username: '@prog_jobs',
    title: 'Programming Jobs',
    description: 'General programming positions',
    isMonitored: true,
  },
  {
    username: '@itfreelance',
    title: 'IT Freelance',
    description: 'Freelance IT and developer jobs',
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
