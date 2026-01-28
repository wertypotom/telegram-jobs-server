---
name: migration-writer
description: Guide for writing MongoDB database migrations using the custom migration system. Use when creating schema changes, adding fields, data transformations, or any database structure modifications. Covers version management, up/down patterns, batch processing, and rollback safety.
---

# Migration Writer

Guide for creating MongoDB migrations using the project's custom migration system.

## System Overview

Custom versioning system (not migrate-mongo) with:

- Sequential version numbers (001, 002, 003...)
- Up/down pattern for apply/rollback
- Migration logging with timestamps
- Batch processing for large datasets

See [`src/migrations/README.md`](file:///Users/werty.potom/Desktop/untitled%20folder/telegram-jobs-server/src/migrations/README.md) for CLI usage.

## Migration Template

```typescript
import { Model } from '@modules/feature/model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration001: Migration = {
  version: 1,
  name: 'descriptive-name',

  async up() {
    Logger.info('Running migration 001: [Description]');

    // Your changes here
    await Model.updateMany({ newField: { $exists: false } }, { $set: { newField: 'default' } });

    Logger.info('Migration 001 complete');
  },

  async down() {
    Logger.info('Rolling back migration 001');

    await Model.updateMany({}, { $unset: { newField: '' } });

    Logger.info('Migration 001 rolled back');
  },
};
```

## Creating a Migration

### 1. Create File

```bash
# Next number is 011
touch src/migrations/versions/011-add-user-preferences.ts
```

**Naming**: `NNN-kebab-case-description.ts`

### 2. Implement

```typescript
import { User } from '@modules/user/user.model';
import { Logger } from '@utils/logger';
import { Migration } from '../types';

export const migration011: Migration = {
  version: 11,
  name: 'add-user-preferences',

  async up() {
    Logger.info('Running migration 011: Add user preferences');

    const usersToUpdate = await User.find({
      preferences: { $exists: false },
    });

    Logger.info(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      Logger.info('No users need migration');
      return;
    }

    const bulkOps = usersToUpdate.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { preferences: { theme: 'light' } } },
      },
    }));

    const result = await User.bulkWrite(bulkOps);

    Logger.info('Migration 011 complete', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  },

  async down() {
    Logger.info('Rolling back migration 011');
    await User.updateMany({}, { $unset: { preferences: '' } });
    Logger.info('Migration 011 rolled back');
  },
};
```

### 3. Register

Update `src/migrations/index.ts`:

```typescript
import { migration011 } from './versions/011-add-user-preferences';

const migrations: Migration[] = [
  // ... existing
  migration011, // Add here
];
```

### 4. Test

```bash
npm run migrate:status  # Check status
npm run migrate:up      # Run migration
npm run migrate:down    # Test rollback
npm run migrate:up      # Re-run to final state
```

## Migration Patterns

For detailed examples, see:

**[references/patterns.md](references/patterns.md)** - 7 common migration patterns:

- Simple field addition
- Conditional updates
- Bulk write for performance
- Large dataset batching
- External API calls (rate limited)
- Index creation
- Data transformation

## Best Practices

### Idempotency

Migrations must be safe to re-run:

```typescript
// ✅ Good
const count = await Model.countDocuments({ newField: { $exists: false } });
if (count === 0) return;

// ❌ Bad
await Model.updateMany({}, { $set: { newField: 'value' } });
```

### Rollback Safety

`down()` reverses `up()` exactly:

```typescript
async up() {
  await Model.updateMany({}, { $set: { status: 'active' } });
}

async down() {
  await Model.updateMany({}, { $unset: { status: '' } });
}
```

### Error Handling

Handle per-record errors:

```typescript
for (const doc of docs) {
  try {
    doc.transformed = await transform(doc);
    await doc.save();
  } catch (error) {
    Logger.error(`Failed ${doc._id}:`, error);
    // Continue with others
  }
}
```

### Progress Logging

```typescript
if (processed % 100 === 0) {
  Logger.info(`Progress: ${processed}/${total}`);
}
```

## Common MongoDB Operations

```typescript
// Set field
{
  $set: {
    field: value;
  }
}

// Unset field
{
  $unset: {
    field: '';
  }
}

// Rename field
{
  $rename: {
    oldName: 'newName';
  }
}

// Check existence
{
  field: {
    $exists: true;
  }
}
{
  $or: [{ field: { $exists: false } }, { field: null }];
}
```

## Checklist

- [ ] Sequential version number
- [ ] Descriptive kebab-case name
- [ ] `up()` implements change
- [ ] `down()` reverses change
- [ ] Idempotent (safe to re-run)
- [ ] Registered in `index.ts`
- [ ] Tested (up → verify → down → verify → up)
- [ ] Batching for large datasets
- [ ] Progress logging
- [ ] Per-record error handling
