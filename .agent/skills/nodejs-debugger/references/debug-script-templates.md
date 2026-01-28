# Debug Script Examples

Template scripts for common debugging scenarios.

## Template 1: User State Inspector

**File**: `src/scripts/debug-user-state.ts`

```typescript
// DEBUG SCRIPT: Inspect user subscription state
import mongoose from 'mongoose';
import 'dotenv/config';

import { UserRepository } from '@modules/user/user.repository';

async function inspectUserState(userId: string) {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('// DEBUG: Connected to MongoDB');

    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);

    if (!user) {
      console.log('// DEBUG: User not found');
      return;
    }

    console.log('// DEBUG: User State:');
    console.log('  - ID:', user._id);
    console.log('  - Email:', user.email);
    console.log('  - Plan:', user.plan);
    console.log('  - Subscribed Channels:', user.subscribedChannels);
    console.log('  - Viewed Jobs Count:', user.viewedJobs.length);
    console.log('  - Subscription Changes:', user.subscriptionChanges);

    await mongoose.disconnect();
  } catch (error) {
    console.error('// DEBUG: Error:', error);
    process.exit(1);
  }
}

// Usage: ts-node -r tsconfig-paths/register src/scripts/debug-user-state.ts
const userId = process.argv[2] || 'USER_ID_HERE';
inspectUserState(userId);
```

**Run:**

```bash
ts-node -r tsconfig-paths/register src/scripts/debug-user-state.ts 507f1f77bcf86cd799439011
```

## Template 2: Job Query Debugger

**File**: `src/scripts/debug-job-query.ts`

```typescript
// DEBUG SCRIPT: Test job query with specific filters
import mongoose from 'mongoose';
import 'dotenv/config';

import { JobRepository } from '@modules/job/job.repository';

async function debugJobQuery() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('// DEBUG: Connected to MongoDB');

    const jobRepo = new JobRepository();

    // Test filters
    const filters = {
      channelIds: ['channel-username-1', 'channel-username-2'],
      status: 'parsed' as const,
      stack: ['Node.js', 'React'],
      limit: 10,
      offset: 0,
    };

    console.log('// DEBUG: Testing filters:', JSON.stringify(filters, null, 2));

    const results = await jobRepo.findWithFilters(filters);

    console.log('// DEBUG: Results:');
    console.log('  - Total:', results.total);
    console.log('  - Jobs returned:', results.jobs.length);
    console.log(
      '  - Sample job IDs:',
      results.jobs.slice(0, 3).map((j) => j._id)
    );

    // Inspect first job
    if (results.jobs.length > 0) {
      const job = results.jobs[0];
      console.log('// DEBUG: First Job:');
      console.log('  - ID:', job._id);
      console.log('  - Channel:', job.channelId);
      console.log('  - Status:', job.status);
      console.log('  - Skills:', job.parsedData?.skills);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('// DEBUG: Error:', error);
    process.exit(1);
  }
}

debugJobQuery();
```

## Template 3: Database Collection Inspector

**File**: `src/scripts/debug-collection-stats.ts`

```typescript
// DEBUG SCRIPT: Inspect collection statistics
import mongoose from 'mongoose';
import 'dotenv/config';

async function inspectCollection(collectionName: string) {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('// DEBUG: Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');

    const collection = db.collection(collectionName);

    // Count documents
    const totalCount = await collection.countDocuments();
    console.log(`// DEBUG: Total documents in ${collectionName}:`, totalCount);

    // Get indexes
    const indexes = await collection.indexes();
    console.log(
      `// DEBUG: Indexes on ${collectionName}:`,
      indexes.map((i) => i.name)
    );

    // Sample documents
    const samples = await collection.find().limit(3).toArray();
    console.log(`// DEBUG: Sample documents:`, JSON.stringify(samples, null, 2));

    // Group by status (if applicable)
    try {
      const statusCounts = await collection
        .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
        .toArray();
      console.log(`// DEBUG: Status distribution:`, statusCounts);
    } catch (e) {
      // Status field might not exist
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('// DEBUG: Error:', error);
    process.exit(1);
  }
}

// Usage: ts-node -r tsconfig-paths/register src/scripts/debug-collection-stats.ts jobs
const collectionName = process.argv[2] || 'jobs';
inspectCollection(collectionName);
```

## Template 4: Parser Test Script

**File**: `src/scripts/debug-parser.ts`

```typescript
// DEBUG SCRIPT: Test job parser with sample text
import 'dotenv/config';

import { JobParserService } from '@modules/job/services/job-parser.service';

const sampleJobText = `
🔥 Senior Node.js Developer

We're looking for an experienced Node.js developer to join our team.

Requirements:
- 5+ years Node.js experience
- Strong TypeScript skills
- MongoDB, PostgreSQL knowledge
- Docker, Kubernetes expertise

Salary: $120k - $150k
Location: Remote
Company: TechCorp

Apply: jobs@techcorp.com
`;

async function testParser() {
  try {
    const parser = new JobParserService();

    console.log('// DEBUG: Testing parser with sample text');
    console.log('// DEBUG: Text length:', sampleJobText.length);

    const result = await parser.parseJobText(sampleJobText);

    console.log('// DEBUG: Parser Result:');
    console.log('  - Is Job:', result?.isJobPosting);
    console.log('  - Skills:', result?.parsedData?.skills);
    console.log('  - Job Type:', result?.parsedData?.jobType);
    console.log('  - Seniority:', result?.parsedData?.seniority);
    console.log('  - Location:', result?.parsedData?.location);
    console.log('  - Company:', result?.parsedData?.company);
    console.log('  - Full Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('// DEBUG: Parser Error:', error);
  }
}

testParser();
```

## Template 5: Environment Checker

**File**: `src/scripts/debug-env.ts`

```typescript
// DEBUG SCRIPT: Verify environment configuration
import 'dotenv/config';

function checkEnv() {
  console.log('// DEBUG: Environment Variables Check');

  const requiredVars = [
    'NODE_ENV',
    'MONGO_URI',
    'NEXTAUTH_SECRET',
    'TELEGRAM_API_ID',
    'TELEGRAM_API_HASH',
    'GEMINI_API_KEY',
  ];

  const optionalVars = ['SENTRY_DSN', 'ABACUS_API_KEY', 'LEMONSQUEEZY_API_KEY'];

  console.log('\n// DEBUG: Required Variables:');
  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const displayValue = value
      ? varName.includes('KEY') || varName.includes('SECRET')
        ? `${value.substring(0, 10)}...`
        : value
      : 'MISSING';
    console.log(`${status} ${varName}: ${displayValue}`);
  });

  console.log('\n// DEBUG: Optional Variables:');
  optionalVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚠️';
    const displayValue = value ? `${value.substring(0, 10)}...` : 'Not set';
    console.log(`${status} ${varName}: ${displayValue}`);
  });
}

checkEnv();
```

## Running Debug Scripts

```bash
# With ts-node and path aliases
ts-node -r tsconfig-paths/register src/scripts/debug-script-name.ts

# With arguments
ts-node -r tsconfig-paths/register src/scripts/debug-user-state.ts USER_ID

# With environment override
NODE_ENV=development ts-node -r tsconfig-paths/register src/scripts/debug-parser.ts
```

## Cleanup

**Remove all debug scripts after issue resolved:**

```bash
# Find all debug scripts
find src/scripts -name "debug-*.ts"

# Delete them
rm src/scripts/debug-*.ts

# Verify
git status src/scripts/
```
