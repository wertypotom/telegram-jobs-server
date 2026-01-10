// CRITICAL: Load .env FIRST before any other imports that read process.env
import { envConfig } from '@config/env.config';
import { Channel } from '@modules/channel/channel.model';
import { CHANNEL_SEED_DATA } from '@modules/channel/channel.seed';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Channel Seed Script
 * Updates all channels with category and tags from CHANNEL_SEED_DATA
 */
async function seedChannels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(envConfig.mongodbUri);
    Logger.info('Connected to MongoDB');

    Logger.info(`Processing ${CHANNEL_SEED_DATA.length} channels from seed data`);

    let updated = 0;
    let created = 0;
    const skipped = 0;

    for (const seedChannel of CHANNEL_SEED_DATA) {
      // Derive tags from category
      const tags = deriveTagsFromCategory(seedChannel.category, seedChannel.title);

      const channel = await Channel.findOne({ username: seedChannel.username });

      if (channel) {
        // Update existing channel
        channel.category = seedChannel.category;
        channel.tags = tags;
        channel.title = seedChannel.title;
        channel.description = seedChannel.description;
        channel.memberCount = seedChannel.memberCount as any; // Can be string like "80K+"
        await channel.save();
        updated++;
        Logger.info(`✅ Updated: ${seedChannel.username} (${seedChannel.category})`);
      } else {
        // Create new channel
        await Channel.create({
          username: seedChannel.username,
          title: seedChannel.title,
          description: seedChannel.description,
          category: seedChannel.category,
          tags,
          memberCount: seedChannel.memberCount,
          isMonitored: true,
        });
        created++;
        Logger.info(`✨ Created: ${seedChannel.username} (${seedChannel.category})`);
      }
    }

    Logger.info('Channel seed completed', {
      total: CHANNEL_SEED_DATA.length,
      created,
      updated,
      skipped,
    });

    await mongoose.disconnect();
    Logger.info('Disconnected from MongoDB');
  } catch (error) {
    Logger.error('Channel seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

/**
 * Derive tags from category and title
 */
function deriveTagsFromCategory(category: string, title: string): string[] {
  const tags: string[] = [category];

  // Add keyword-based tags
  const lowerTitle = title.toLowerCase();

  // Remote tag
  if (lowerTitle.includes('remote')) {
    tags.push('Remote');
  }

  // Tech stack tags
  const techKeywords = [
    'React',
    'Vue',
    'Angular',
    'JavaScript',
    'TypeScript',
    'Node',
    'Python',
    'Java',
    'Go',
    'Golang',
    'Rust',
    'PHP',
    'Ruby',
    'C++',
    'iOS',
    'Android',
    'Flutter',
    'React Native',
    'Swift',
    'Kotlin',
    'DevOps',
    'AWS',
    'Azure',
    'GCP',
    'Docker',
    'Kubernetes',
    'AI',
    'ML',
    'Data Science',
    'Big Data',
  ];

  for (const keyword of techKeywords) {
    if (lowerTitle.toLowerCase().includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  }

  return [...new Set(tags)]; // Remove duplicates
}

// Run if called directly
if (require.main === module) {
  seedChannels();
}

export { seedChannels };
