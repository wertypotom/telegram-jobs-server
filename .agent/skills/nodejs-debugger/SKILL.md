---
name: nodejs-debugger
description: Guide for debugging Node.js/TypeScript applications. Use when investigating bugs, analyzing runtime behavior, inspecting database state, or troubleshooting issues. Covers debugging strategies, temporary script marking, logging patterns, database inspection, and cleanup workflows.
---

# Node.js Application Debugger

Debug Node.js/TypeScript applications efficiently with proper cleanup workflows.

## Core Principle: Temporary Code Marking

**CRITICAL**: All debugging code is temporary and MUST be removed after issue resolution.

### Marking Convention

Use `// DEBUG: [description]` to mark ALL temporary debugging code:

```typescript
// DEBUG: Inspecting user subscription state
console.log('User channels:', user.subscribedChannels);

// DEBUG: Tracking async parse trigger
Logger.debug('Job created, triggering parse', { jobId: newJob._id });

// DEBUG: Database query inspection
const rawResult = await this.jobRepo.findWithFilters(filters);
console.log('Raw DB result:', JSON.stringify(rawResult, null, 2));
```

For temporary debugging scripts, use filename pattern: `debug-[purpose].ts`:

```
src/scripts/debug-channel-subscriptions.ts
src/scripts/debug-job-parser.ts
```

## Debugging Workflow

### 1. Identify the Problem

**Gather context:**

- Error messages and stack traces
- User reports or reproduction steps
- Expected vs actual behavior
- Environment (dev, staging, prod)

**Locate the issue:**

```bash
# Search for error messages
grep -r "error pattern" src/

# Find relevant files
find src/ -name "*feature*"

# Check recent changes
git log --oneline -n 20 src/modules/[module]
```

### 2. Add Strategic Logging

Follow project's Logger patterns (see references/logger-patterns.md):

```typescript
import { Logger } from '@utils/logger';

// DEBUG: Entry point logging
Logger.debug('Method invoked', { userId, params });

// DEBUG: State inspection
Logger.debug('User state before update', {
  plan: user.plan,
  channels: user.subscribedChannels.length,
});

// DEBUG: Branch tracking
if (condition) {
  Logger.debug('Taking branch A', { reason });
} else {
  Logger.debug('Taking branch B', { reason });
}

// DEBUG: Exit point logging
Logger.debug('Method completed', { result });
```

**Avoid:**

- ❌ `console.log()` without `// DEBUG:` marker
- ❌ Logging sensitive data (passwords, tokens, full user objects)
- ❌ Excessive logging in loops (use counters instead)

### 3. Database Inspection Scripts

Create temporary scripts in `src/scripts/debug-*.ts`:

```typescript
// DEBUG SCRIPT: debug-user-channels.ts
import mongoose from 'mongoose';
import 'dotenv/config';

import { UserRepository } from '@modules/user/user.repository';

async function debugUserChannels() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('// DEBUG: Connected to MongoDB');

    const userRepo = new UserRepository();
    const user = await userRepo.findById('user-id-here');

    // DEBUG: Inspect state
    console.log('// DEBUG: User channels:', user?.subscribedChannels);
    console.log('// DEBUG: Plan:', user?.plan);
    console.log('// DEBUG: Subscription changes:', user?.subscriptionChanges);

    await mongoose.disconnect();
  } catch (error) {
    console.error('// DEBUG: Error:', error);
    process.exit(1);
  }
}

debugUserChannels();
```

**Run with:**

```bash
ts-node -r tsconfig-paths/register src/scripts/debug-user-channels.ts
```

### 4. TypeScript Debugging

**Type error inspection:**

```bash
# Check all type errors
npm run check-types

# Locate specific error
npm run check-types 2>&1 | grep "error TS"
```

**Common patterns:**

```typescript
// DEBUG: Type guard logging
if (this.isJobPosting(data)) {
  Logger.debug('Type guard passed', { data });
} else {
  Logger.debug('Type guard failed', { data });
}

// DEBUG: Type assertion inspection
const typed = data as ExpectedType;
Logger.debug('After type assertion', { typed });
```

### 5. Request/Response Debugging

**Route debugging:**

```typescript
// In controller
export const getJobFeed = async (req: Request, res: Response) => {
  // DEBUG: Inspect incoming request
  Logger.debug('GET /api/jobs/search request', {
    body: req.body,
    query: req.query,
    userId: req.user?.id,
  });

  const result = await jobService.getJobFeed(req.body, req.user!.id);

  // DEBUG: Inspect response
  Logger.debug('GET /api/jobs/search response', {
    jobCount: result.jobs.length,
    total: result.total,
  });

  res.json({ data: result });
};
```

**HTTP testing:**

```bash
# Test with curl
curl -X POST http://localhost:3001/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"stack": ["Node.js"]}'

# Check logs
tail -f logs/app.log | grep DEBUG
```

### 6. Async/Promise Debugging

```typescript
// DEBUG: Promise resolution tracking
this.parseJobInBackground(newJob._id).catch((err) => {
  Logger.debug('Background parse failed', { jobId: newJob._id, error: err.message });
});

// DEBUG: Async timing
const startTime = Date.now();
await someAsyncOperation();
Logger.debug('Operation duration', { ms: Date.now() - startTime });

// DEBUG: Promise state
Promise.resolve(asyncOp())
  .then((result) => Logger.debug('Promise resolved', { result }))
  .catch((err) => Logger.debug('Promise rejected', { error: err.message }));
```

### 7. MongoDB Query Debugging

```typescript
// DEBUG: Query inspection
const filters = { channelIds, status: 'parsed' };
Logger.debug('MongoDB query filters', { filters });

const result = await this.jobRepo.findWithFilters(filters);
Logger.debug('MongoDB query result', {
  count: result.jobs.length,
  total: result.total,
});

// DEBUG: Check indexes
// In debug script:
const indexes = await mongoose.connection.db.collection('jobs').indexes();
console.log('// DEBUG: Collection indexes:', indexes);
```

## Debugging Tools Reference

### Built-in Logger

Project uses custom Logger (see references/logger-patterns.md):

- `Logger.debug()` - Development debugging
- `Logger.info()` - General info
- `Logger.warn()` - Warnings
- `Logger.error()` - Errors (auto-captured by Sentry)

### Node.js Debugger

```bash
# Start with inspector
node --inspect-brk dist/index.js

# Attach with Chrome DevTools
# Navigate to: chrome://inspect
```

### Environment Variables

```bash
# Enable debug mode
DEBUG=app:* npm run dev

# Verbose MongoDB logging
MONGOOSE_DEBUG=true npm run dev
```

## Cleanup Workflow

**MANDATORY before commit:**

### 1. Search for Debug Markers

```bash
# Find all DEBUG comments
grep -r "// DEBUG" src/

# Find debug scripts
find src/scripts -name "debug-*.ts"

# Find console.log statements
grep -r "console.log" src/ | grep -v node_modules
```

### 2. Remove Debug Code

**Delete:**

- All lines with `// DEBUG:` markers
- All `src/scripts/debug-*.ts` files
- Temporary `console.log()` statements
- Test data inserted for debugging

**Verify:**

```bash
# Ensure no debug markers remain
npm run lint
npm run check-types
npm test

# Search again
grep -r "DEBUG" src/ | grep -v node_modules
```

### 3. Final Checklist

Before marking issue as resolved:

- ✅ All `// DEBUG:` markers removed
- ✅ All `debug-*.ts` scripts deleted
- ✅ Console.log statements removed
- ✅ Tests pass
- ✅ No linting errors
- ✅ No type errors
- ✅ Code reviewed for leftover temporary logic

## Common Debugging Scenarios

### Issue: User Not Seeing Expected Jobs

**Debug steps:**

```typescript
// 1. Check user subscription
// DEBUG: User state
const user = await userRepo.findById(userId);
Logger.debug('User subscriptions', {
  channels: user.subscribedChannels,
  plan: user.plan,
});

// 2. Check job query filters
// DEBUG: Query construction
const filters = buildFilters(user);
Logger.debug('Job query filters', { filters });

// 3. Check actual jobs in DB
// Create debug script: debug-job-count.ts
const jobCount = await jobRepo.count({ channelIds: user.subscribedChannels });
console.log('// DEBUG: Jobs in subscribed channels:', jobCount);
```

### Issue: Parser Not Working

```typescript
// DEBUG: Parser input/output
Logger.debug('Parser input', { rawText: job.rawText });

const result = await this.aiProvider.parseJob(job.rawText);
Logger.debug('Parser output', {
  isJob: result.isJobPosting,
  skills: result.parsedData?.skills,
});
```

### Issue: Database Query Slow

```typescript
// DEBUG: Query performance
const startTime = Date.now();
const result = await this.jobRepo.findWithFilters(filters);
Logger.debug('Query performance', {
  duration: Date.now() - startTime,
  resultCount: result.jobs.length,
  filters,
});

// Check explain plan in debug script
const explain = await collection.find(query).explain('executionStats');
console.log('// DEBUG: Query explain:', JSON.stringify(explain, null, 2));
```

## Integration with Backend Developer Workflow

This skill follows conventions from `.agent/workflows/backend-developer.md`:

- **Line 78-80**: Use `// DEBUG: [TaskID]` marker convention
- **Zero-Tolerance Policy**: Remove all debug code before commit
- **Clean Code**: Leave codebase pristine after debugging

Reference the workflow for:

- Architecture patterns to maintain during debugging
- Code quality standards
- Testing requirements after fixes
