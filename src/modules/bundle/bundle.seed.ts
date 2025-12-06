import { Bundle } from './bundle.model';
import { Logger } from '@utils/logger';

export const seedBundles = async (): Promise<void> => {
  try {
    const count = await Bundle.countDocuments();
    if (count > 0) {
      Logger.info(`Bundles already seeded (${count} bundles exist)`);
      return;
    }

    const bundles = [
      {
        id: 'frontend',
        title: 'Frontend Focus',
        description: 'React, Vue, JS • 5 Channels',
        icon: 'Code',
        channels: [
          '@frontend_jobs',
          '@javascript_jobs',
          '@job_react',
          '@nodejs_jobs',
          '@job_for_juniors',
        ],
        order: 1,
        category: 'development',
        isActive: true,
      },
      {
        id: 'backend',
        title: 'Backend Essentials',
        description: 'Node, APIs, Servers • 5 Channels',
        icon: 'Server',
        channels: [
          '@nodejs_jobs',
          '@fullstack_jobs',
          '@javascript_jobs',
          '@job_for_juniors',
          '@frontend_jobs',
        ],
        order: 2,
        category: 'development',
        isActive: true,
      },
      {
        id: 'fullstack',
        title: 'Full Stack',
        description: 'End-to-end development • 5 Channels',
        icon: 'Layers',
        channels: [
          '@fullstack_jobs',
          '@frontend_jobs',
          '@javascript_jobs',
          '@nodejs_jobs',
          '@job_for_juniors',
        ],
        order: 3,
        category: 'development',
        isActive: true,
      },
    ];

    await Bundle.insertMany(bundles);
    Logger.info(`Successfully seeded ${bundles.length} bundles`);
  } catch (error) {
    Logger.error('Failed to seed bundles:', error);
    throw error;
  }
};
