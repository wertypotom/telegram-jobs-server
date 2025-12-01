# Migration System

Centralized database migration system with versioning and logging.

## Structure

```
src/migrations/
├── index.ts                    # Migration runner (CLI)
├── migration-logger.ts         # Tracks applied migrations
├── migration-log.json          # Log file (auto-generated)
├── types.ts                    # Type definitions
└── versions/
    └── 001-add-viewed-jobs-field.ts
```

## Commands

### Run pending migrations
```bash
npm run migrate:up
```

### Check migration status
```bash
npm run migrate:status
```

### Rollback last migration
```bash
npm run migrate:down
```

### Rollback to specific version
```bash
npm run migrate down 0  # Rollback all
npm run migrate down 1  # Rollback to version 1
```

## Creating New Migrations

1. Create new file in `versions/` folder:
```typescript
// src/migrations/versions/002-your-migration-name.ts
import { Migration } from '../types';
import { YourModel } from '@modules/your-model/your-model.model';

export const migration002: Migration = {
  version: 2,
  name: 'your-migration-name',

  async up() {
    // Apply changes
    await YourModel.updateMany({}, { $set: { newField: 'default' } });
  },

  async down() {
    // Rollback changes (optional)
    await YourModel.updateMany({}, { $unset: { newField: '' } });
  },
};
```

2. Register in `index.ts`:
```typescript
import { migration002 } from './versions/002-your-migration-name';

const migrations: Migration[] = [
  migration001,
  migration002, // Add here
];
```

3. Run migration:
```bash
npm run migrate:up
```

## Features

- ✅ Sequential versioning
- ✅ Idempotent (safe to run multiple times)
- ✅ Migration log with timestamps
- ✅ Rollback support
- ✅ Status checking
- ✅ Error handling and logging
- ✅ Stops on first failure

## Migration Log

Auto-generated `migration-log.json` tracks:
- Last applied version
- All migration attempts
- Success/failure status
- Timestamps
- Error messages
