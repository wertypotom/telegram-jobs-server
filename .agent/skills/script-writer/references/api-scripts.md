# External API Scripts

Patterns for fetching data from Telegram, scraping, AI processing, and third-party integrations.

## Telegram Channel Extraction

Extract channel info using GramJS:

```typescript
import { envConfig } from '@config/env.config';
import { AIProviderFactory } from '@shared/providers/ai-provider.factory';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import path from 'path';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const CHANNELS_TO_EXTRACT = ['@channel1', '@channel2'];

async function extractChannelInfo() {
  let client: TelegramClient | null = null;

  try {
    // Initialize Telegram client
    const session = new StringSession(envConfig.telegramSessionString || '');
    client = new TelegramClient(
      session,
      parseInt(envConfig.telegramApiId),
      envConfig.telegramApiHash,
      { connectionRetries: 5 }
    );

    await client.connect();
    Logger.info('✅ Connected to Telegram');

    const channelInfos = [];

    for (const username of CHANNELS_TO_EXTRACT) {
      try {
        Logger.info(`Fetching: ${username}`);

        // Get channel entity
        const entity = await client.getEntity(username);

        // Get full channel info
        const fullChannel = await client.invoke(
          new Api.channels.GetFullChannel({ channel: entity })
        );

        const channel = fullChannel.chats[0] as Api.Channel;
        const fullChannelInfo = fullChannel.fullChat as Api.ChannelFull;

        const info = {
          username,
          title: channel.title || 'Unknown',
          description: fullChannelInfo.about || 'No description',
          memberCount: fullChannelInfo.participantsCount,
        };

        channelInfos.push(info);
        Logger.info(`  ✓ ${info.title} - ${info.memberCount} members`);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error: any) {
        Logger.error(`  ✗ Failed to fetch ${username}:`, error.message);
      }
    }

    console.log(JSON.stringify(channelInfos, null, 2));

    await client.disconnect();
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Failed to extract channel info:', error);
    if (client) await client.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  extractChannelInfo();
}
```

## AI Processing Script

Process records using AI with rate limiting:

```typescript
async function processWithAI() {
  try {
    await connectDatabase();

    const aiProvider = AIProviderFactory.getProvider();
    const records = await Model.find({ needsProcessing: true });

    Logger.info(`Processing ${records.length} records with AI`);

    let processed = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const result = await aiProvider.generateContent(
          `Analyze: ${record.content}`,
          'You are an expert analyzer',
          false
        );

        record.aiProcessed = result.trim();
        record.needsProcessing = false;
        await record.save();

        processed++;

        if (processed % 10 === 0) {
          Logger.info(`Progress: ${processed}/${records.length}`);
          // Rate limiting delay every 10 requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        Logger.error(`Failed to process ${record._id}:`, error);
        failed++;
      }
    }

    Logger.info(`Complete: ${processed} processed, ${failed} failed`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error('AI processing failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}
```

## Concurrent API Calls

Process in parallel with controlled concurrency:

```typescript
async function processWithConcurrency() {
  try {
    await connectDatabase();

    const records = await Model.find({ status: 'pending' });
    const CONCURRENT_REQUESTS = 3;

    let processed = 0;
    let failed = 0;

    // Process in chunks
    for (let i = 0; i < records.length; i += CONCURRENT_REQUESTS) {
      const chunk = records.slice(i, i + CONCURRENT_REQUESTS);

      const results = await Promise.allSettled(
        chunk.map(async (record) => {
          const data = await externalAPI.fetch(record.id);
          record.data = data;
          await record.save();
          return record._id;
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') processed++;
        else {
          failed++;
          Logger.error('Failed:', result.reason);
        }
      });

      Logger.info(`Progress: ${processed + failed}/${records.length}`);

      // Delay between chunks
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    Logger.info(`Complete: ${processed} processed, ${failed} failed`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error('Processing failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}
```

## Retry Logic for Failed Requests

```typescript
async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      Logger.warn(`Attempt ${attempt}/${maxRetries} failed for ${url}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError}`);
}

async function fetchExternalData() {
  try {
    await connectDatabase();

    const urls = await Model.find({}).select('url');

    for (const { url } of urls) {
      try {
        const data = await fetchWithRetry(url);
        await Model.updateOne({ url }, { $set: { data } });
        Logger.info(`✓ Fetched: ${url}`);
      } catch (error) {
        Logger.error(`✗ Failed: ${url}`, error);
      }
    }

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    Logger.error('Fetch failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}
```
