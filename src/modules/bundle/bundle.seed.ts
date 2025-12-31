import { Logger } from '@utils/logger';

import { Bundle } from './bundle.model';

/**
 * Bundle seed data - aligned with categories from channel.seed.ts
 * Bundles contain 5 channels each (free tier limit)
 */
const BUNDLE_SEED_DATA = [
  {
    id: 'frontend',
    title: 'Frontend Focus',
    description: 'React, Vue, TypeScript • 5 Channels',
    icon: 'Code',
    channels: [
      '@frontend_jobs',
      '@job_react',
      '@javascript_jobs',
      '@typescript_jobs',
      '@nextjs_jobs',
    ],
    order: 1,
    category: 'Frontend',
    isActive: true,
  },
  {
    id: 'backend',
    title: 'Backend Essentials',
    description: 'Node, Python, Go • 5 Channels',
    icon: 'Server',
    channels: ['@nodejs_jobs', '@forpython', '@golang_jobs', '@backend_jobs', '@php_jobs'],
    order: 2,
    category: 'Backend',
    isActive: true,
  },
  {
    id: 'mobile',
    title: 'Mobile Development',
    description: 'iOS, Android, React Native • 5 Channels',
    icon: 'Smartphone',
    channels: ['@ios_jobs', '@android_jobs', '@react_native_jobs', '@swift_jobs', '@kotlin_jobs'],
    order: 3,
    category: 'Mobile',
    isActive: true,
  },
  {
    id: 'devops',
    title: 'DevOps & Cloud',
    description: 'Kubernetes, AWS, Azure • 4 Channels',
    icon: 'Cloud',
    channels: ['@devops_jobs', '@kubernetes_jobs', '@aws_jobs', '@azure_jobs'],
    order: 4,
    category: 'DevOps',
    isActive: true,
  },
  {
    id: 'data-science',
    title: 'Data & AI',
    description: 'ML, Data Science, Analytics • 5 Channels',
    icon: 'Brain',
    channels: [
      '@data_science_jobs',
      '@ml_jobs',
      '@ai_jobs',
      '@data_analyst_jobs',
      '@data_engineer_jobs',
    ],
    order: 5,
    category: 'Data Science',
    isActive: true,
  },
  {
    id: 'general',
    title: 'General IT',
    description: 'Entry-level & Remote • 5 Channels',
    icon: 'Briefcase',
    channels: [
      '@job_for_juniors',
      '@geekjobs',
      '@developer_jobs',
      '@remote_developers',
      '@getitrussia',
    ],
    order: 6,
    category: 'General IT',
    isActive: true,
  },
];

export const seedBundles = async (): Promise<void> => {
  try {
    const count = await Bundle.countDocuments();
    if (count > 0) {
      Logger.info(`Bundles already seeded (${count} bundles exist)`);
      return;
    }

    await Bundle.insertMany(BUNDLE_SEED_DATA);
    Logger.info(`Successfully seeded ${BUNDLE_SEED_DATA.length} bundles`);
  } catch (error) {
    Logger.error('Failed to seed bundles:', error);
    throw error;
  }
};

/**
 * Force re-seed bundles (use with caution - deletes existing bundles)
 */
export const reseedBundles = async (): Promise<void> => {
  try {
    await Bundle.deleteMany({});
    await Bundle.insertMany(BUNDLE_SEED_DATA);
    Logger.info(`Re-seeded ${BUNDLE_SEED_DATA.length} bundles`);
  } catch (error) {
    Logger.error('Failed to re-seed bundles:', error);
    throw error;
  }
};
