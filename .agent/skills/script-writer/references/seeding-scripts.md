# Database Seeding Scripts

Patterns for seeding channels, bundles, market insights, and other data.

## Basic Seeding Pattern

```typescript
import { envConfig } from '@config/env.config';
import { Model } from '@modules/feature/model';
import { SEED_DATA } from '@modules/feature/seed-data';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function seedData() {
  try {
    await mongoose.connect(envConfig.mongodbUri);
    Logger.info('Connected to MongoDB');

    Logger.info(`Processing ${SEED_DATA.length} items`);

    let created = 0;
    let updated = 0;

    for (const data of SEED_DATA) {
      const existing = await Model.findOne({ uniqueField: data.uniqueField });

      if (existing) {
        // Update existing
        Object.assign(existing, data);
        await existing.save();
        updated++;
        Logger.info(`✅ Updated: ${data.name}`);
      } else {
        // Create new
        await Model.create(data);
        created++;
        Logger.info(`✨ Created: ${data.name}`);
      }
    }

    Logger.info('Seeding complete', { created, updated, total: SEED_DATA.length });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    Logger.error('Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  seedData();
}

export { seedData };
```

## Seeding with Data Transformation

Example: Deriving tags from category

```typescript
async function seedChannels() {
  try {
    await mongoose.connect(envConfig.mongodbUri);

    for (const seedChannel of CHANNEL_SEED_DATA) {
      // Transform data
      const tags = deriveTagsFromCategory(seedChannel.category, seedChannel.title);

      const channel = await Channel.findOne({ username: seedChannel.username });

      if (channel) {
        channel.category = seedChannel.category;
        channel.tags = tags;
        channel.title = seedChannel.title;
        await channel.save();
      } else {
        await Channel.create({
          ...seedChannel,
          tags,
          isMonitored: true,
        });
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    Logger.error('Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

function deriveTagsFromCategory(category: string, title: string): string[] {
  const tags: string[] = [category];

  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('remote')) tags.push('Remote');

  const techKeywords = ['React', 'Vue', 'Python', 'Node', 'DevOps'];
  for (const keyword of techKeywords) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  }

  return [...new Set(tags)]; // Remove duplicates
}
```

## Bulk Seeding for Performance

For large datasets:

```typescript
async function seedBulk() {
  try {
    await mongoose.connect(envConfig.mongodbUri);

    // Prepare bulk operations
    const bulkOps = SEED_DATA.map((data) => ({
      updateOne: {
        filter: { uniqueField: data.uniqueField },
        update: { $set: data },
        upsert: true, // Create if doesn't exist
      },
    }));

    const result = await Model.bulkWrite(bulkOps);

    Logger.info('Bulk seed complete', {
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    Logger.error('Bulk seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
```

## Seeding with Validation

Skip invalid records, continue with valid ones:

```typescript
async function seedWithValidation() {
  try {
    await mongoose.connect(envConfig.mongodbUri);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const data of SEED_DATA) {
      // Validate data
      if (!data.requiredField) {
        Logger.warn(`Skipping invalid record: ${data.name}`);
        skipped++;
        continue;
      }

      try {
        const existing = await Model.findOne({ uniqueField: data.uniqueField });

        if (existing) {
          Object.assign(existing, data);
          await existing.save();
          updated++;
        } else {
          await Model.create(data);
          created++;
        }
      } catch (error) {
        Logger.error(`Failed to seed ${data.name}:`, error);
        skipped++;
      }
    }

    Logger.info('Seeding complete', { created, updated, skipped });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    Logger.error('Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}
```
