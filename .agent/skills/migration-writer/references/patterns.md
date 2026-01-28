# Migration Patterns

7 common patterns for MongoDB migrations.

## Pattern 1: Simple Field Addition

```typescript
async up() {
  Logger.info('Adding new field...');

  await Model.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: defaultValue } }
  );

  Logger.info('Field added');
}

async down() {
  await Model.updateMany({}, { $unset: { newField: '' } });
}
```

## Pattern 2: Conditional Updates

```typescript
async up() {
  const docsToUpdate = await Model.find({
    $or: [
      { field: { $exists: false } },
      { field: null },
    ],
  });

  Logger.info(`Found ${docsToUpdate.length} docs to update`);

  for (const doc of docsToUpdate) {
    doc.field = computeValue(doc);
    await doc.save();
  }

  Logger.info('Update complete');
}
```

## Pattern 3: Bulk Write for Performance

```typescript
async up() {
  const docs = await Model.find({ condition: true });

  const bulkOps = docs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { newField: transform(doc) } },
    },
  }));

  const result = await Model.bulkWrite(bulkOps);

  Logger.info('Bulk update complete', {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  });
}
```

## Pattern 4: Large Dataset with Batching

For 1000s of records:

```typescript
async up() {
  Logger.info('Processing large dataset...');

  let processed = 0;
  const batchSize = 100;

  while (true) {
    // Always query unprocessed docs
    const docs = await Model.find({
      newField: { $exists: false },
    }).limit(batchSize);

    if (docs.length === 0) break;

    for (const doc of docs) {
      doc.newField = computeValue(doc);
      await doc.save();
      processed++;

      if (processed % 50 === 0) {
        Logger.info(`Progress: ${processed} documents`);
      }
    }
  }

  Logger.info(`Migration complete: ${processed} processed`);
}
```

**Why this works**: Each iteration queries unprocessed docs, so if migration crashes, re-running picks up where it left off.

## Pattern 5: External API Calls (Rate Limited)

```typescript
async up() {
  const docs = await Model.find({ needsProcessing: true });
  const CONCURRENT_REQUESTS = 3;

  let processed = 0;
  let failed = 0;

  // Process in chunks
  for (let i = 0; i < docs.length; i += CONCURRENT_REQUESTS) {
    const chunk = docs.slice(i, i + CONCURRENT_REQUESTS);

    const results = await Promise.allSettled(
      chunk.map(async (doc) => {
        try {
          const result = await externalAPI.process(doc);
          doc.processedData = result;
          await doc.save();
          return doc._id;
        } catch (error) {
          Logger.warn(`Failed to process ${doc._id}`, error);
          // Set fallback value
          doc.processedData = fallbackValue;
          await doc.save();
        }
      })
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') processed++;
      else failed++;
    });

    Logger.info(`Progress: ${processed + failed}/${docs.length}`);

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  Logger.info(`Complete: ${processed} processed, ${failed} failed`);
}
```

**Key features**:

- Concurrent processing (3 at a time)
- Per-record error handling (doesn't stop on failure)
- Fallback values for failed requests
- Rate limiting delay

## Pattern 6: Index Creation

```typescript
async up() {
  Logger.info('Creating text index...');

  await Model.collection.createIndex(
    {
      title: 'text',
      description: 'text',
    },
    {
      name: 'job_text_search',
      weights: {
        title: 10,      // Title has higher relevance
        description: 5,
      },
    }
  );

  Logger.info('Index created');
}

async down() {
  Logger.info('Dropping index...');
  await Model.collection.dropIndex('job_text_search');
  Logger.info('Index dropped');
}
```

**Note**: Index creation can take time on large collections. Monitor with `db.currentOp()`.

## Pattern 7: Data Transformation

Restructure existing data:

```typescript
async up() {
  const docs = await Model.find({});

  Logger.info(`Transforming ${docs.length} documents`);

  for (const doc of docs) {
    // Transform to new structure
    doc.newFormat = {
      id: doc.oldId,
      name: doc.oldName,
      meta: {
        created: doc.createdAt,
        updated: doc.updatedAt,
      },
    };

    // Remove old fields
    doc.oldId = undefined;
    doc.oldName = undefined;

    await doc.save();
  }

  Logger.info(`Transformed ${docs.length} documents`);
}

async down() {
  const docs = await Model.find({});

  Logger.info(`Reversing transformation for ${docs.length} documents`);

  for (const doc of docs) {
    if (doc.newFormat) {
      // Restore old structure
      doc.oldId = doc.newFormat.id;
      doc.oldName = doc.newFormat.name;
      doc.newFormat = undefined;
      await doc.save();
    }
  }

  Logger.info('Transformation reversed');
}
```

## Real Example: Normalize Job Titles

From production migration `004-normalize-job-titles.ts`:

```typescript
async up() {
  Logger.info('Running migration 004: Normalize job titles');

  const parser = new JobParserService();
  const CONCURRENT_REQUESTS = 3;

  const totalJobs = await Job.countDocuments({
    'parsedData.jobTitle': { $exists: true },
    'parsedData.normalizedJobTitle': { $exists: false },
  });

  Logger.info(`Found ${totalJobs} jobs to normalize`);

  let processed = 0;
  let failed = 0;
  const batchSize = 100;

  while (true) {
    const jobs = await Job.find({
      'parsedData.jobTitle': { $exists: true },
      'parsedData.normalizedJobTitle': { $exists: false },
    }).limit(batchSize);

    if (jobs.length === 0) break;

    for (let i = 0; i < jobs.length; i += CONCURRENT_REQUESTS) {
      const chunk = jobs.slice(i, i + CONCURRENT_REQUESTS);

      const results = await Promise.allSettled(
        chunk.map(async (job) => {
          try {
            const parsed = await parser.parseJobText(job.rawText);

            if (parsed?.normalizedJobTitle) {
              job.parsedData.normalizedJobTitle = parsed.normalizedJobTitle;
            } else {
              // Fallback
              job.parsedData.normalizedJobTitle = job.parsedData.jobTitle;
            }
          } catch (error) {
            // AI parsing failed, use original
            job.parsedData.normalizedJobTitle = job.parsedData.jobTitle;
          }

          await job.save();
          return job._id;
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') processed++;
        else failed++;
      });

      if (processed % 50 === 0) {
        Logger.info(`Progress: ${processed}/${totalJobs}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  Logger.info(`Complete: ${processed} normalized, ${failed} failed`);
}

async down() {
  await Job.updateMany(
    { 'parsedData.normalizedJobTitle': { $exists: true } },
    { $unset: { 'parsedData.normalizedJobTitle': '' } }
  );
}
```

**Combines**:

- Pattern 4: Batching (100 docs at a time)
- Pattern 5: Concurrent API calls (3 at a time)
- Fallback handling (uses original if AI fails)
- Progress tracking
