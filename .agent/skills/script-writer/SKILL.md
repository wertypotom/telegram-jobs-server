---
name: script-writer
description: Guide for writing utility scripts in the backend server. Use when creating database seeding scripts, cleanup tasks, data extraction tools, or any standalone maintenance scripts. Ensures consistent structure, proper DB connection handling, error logging, and path alias usage.
---

# Script Writer

Guide for creating consistent utility scripts following project patterns.

## Quick Start

All scripts follow this unified structure:

```typescript
// CRITICAL: Load .env FIRST before imports that read process.env
import { envConfig } from '@config/env.config';
import { connectDatabase, disconnectDatabase } from '@config/database.config';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * [Script Name]
 * Purpose: [What this script does]
 * Usage: npm run [script-command]
 */
async function main() {
  try {
    Logger.info('[Script Name] started');
    await connectDatabase();

    // === YOUR LOGIC HERE ===

    await disconnectDatabase();
    Logger.info('[Script Name] completed');
    process.exit(0);
  } catch (error) {
    Logger.error('[Script Name] failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
```

## Key Requirements

### Environment & Imports

- Load `.env` **before** imports that read `process.env`
- Use path aliases: `@config`, `@modules`, `@utils`

### Database

Use centralized DB config:

```typescript
import { connectDatabase, disconnectDatabase } from '@config/database.config';
```

Or direct mongoose:

```typescript
import mongoose from 'mongoose';
await mongoose.connect(envConfig.mongodbUri);
```

### Logging

Use `Logger` utility:

```typescript
Logger.info('Message');
Logger.warn('Warning');
Logger.error('Error:', error);
```

For long operations:

```typescript
if (processed % 100 === 0) {
  Logger.info(`Progress: ${processed}/${total}`);
}
```

### Error Handling

Always cleanup on exit:

```typescript
try {
  await connectDatabase();
  // work
  await disconnectDatabase();
  process.exit(0);
} catch (error) {
  Logger.error('Failed:', error);
  await disconnectDatabase();
  process.exit(1);
}
```

### Execution Guard

```typescript
if (require.main === module) {
  main();
}
export { main };
```

## Script Types & Examples

### Database Seeding

For seeding channels, bundles, market insights, etc.

**See**: [references/seeding-scripts.md](references/seeding-scripts.md)

### Cleanup Scripts

For deleting old records, archiving data, maintenance.

**See**: [references/cleanup-scripts.md](references/cleanup-scripts.md)

### External API Scripts

For fetching data from Telegram, scraping, AI processing.

**See**: [references/api-scripts.md](references/api-scripts.md)

## NPM Registration

Add to `package.json`:

```json
{
  "scripts": {
    "script:name": "node run-script.js src/scripts/your-script.ts"
  }
}
```

## Checklist

- [ ] Loads `.env` before other imports
- [ ] Uses path aliases
- [ ] Uses `Logger` (not `console.log`)
- [ ] Connects/disconnects DB properly
- [ ] Try-catch with cleanup
- [ ] Execution guard included
- [ ] Exports main function
- [ ] Progress logging for long ops
- [ ] Registered in `package.json`
