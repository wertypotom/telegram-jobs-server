# Logger Patterns in Project

Reference for Logger usage following project conventions.

## Logger Class Structure

Located at: [src/shared/utils/logger.ts](file:///Users/werty.potom/Desktop/untitled%20folder/telegram-jobs-server/src/shared/utils/logger.ts)

```typescript
import { Logger } from '@utils/logger';

// Available methods:
Logger.info(message, metadata?)    // General info logging
Logger.error(message, error?, options?) // Error logging + Sentry capture (prod)
Logger.warn(message, metadata?)    // Warning logging
Logger.debug(message, metadata?)   // Debug logging (dev only)
```

## Logger Methods

### `Logger.debug()`

**Only logs in development** (`NODE_ENV=development`)

Usage in codebase:

```typescript
// Job service - duplicate detection
Logger.debug('Job already exists', { messageId: data.telegramMessageId });

// Parser service - AI response
Logger.debug('AI Parser Response', { response, jobId });

// Scraper - page fetch
Logger.debug('Fetching external job page', { url });

// Provider - API response
Logger.debug('Gemini response received', { responseLength: text.length });
```

### `Logger.info()`

General application events:

```typescript
Logger.info('Server started', { port: 3001 });
Logger.info('Database connected', { uri: mongoUri });
```

### `Logger.warn()`

Non-critical issues:

```typescript
Logger.warn('Rate limit approaching', { remaining: 10 });
Logger.warn('Deprecated API usage', { route: '/old-endpoint' });
```

### `Logger.error()`

**Automatically captures to Sentry in production**

```typescript
// Basic error
Logger.error('Failed to parse job', error);

// With Sentry context
Logger.error('Payment processing failed', error, {
  tags: { paymentProvider: 'lemon-squeezy' },
  extra: { orderId: order.id, amount: order.amount },
});
```

## Metadata Best Practices

### Good Metadata

```typescript
// Include relevant IDs
Logger.debug('User subscription updated', {
  userId: user._id,
  channels: user.subscribedChannels.length,
});

// Track operation context
Logger.debug('Job search performed', {
  userId,
  filters: { stack: filters.stack, jobType: filters.jobType },
  resultCount: results.jobs.length,
});

// Performance tracking
Logger.debug('Database query completed', {
  collection: 'jobs',
  duration: Date.now() - startTime,
  resultCount: results.length,
});
```

### Avoid

```typescript
// ❌ Too verbose (full objects)
Logger.debug('User data', { user }); // Logs entire object

// ❌ Sensitive data
Logger.debug('Auth attempt', { email, password }); // Never log passwords

// ❌ Not useful
Logger.debug('Here'); // No context
```

## Debugging Flow Examples

### Example 1: Job Creation Flow

```typescript
// Entry
Logger.debug('Creating job from message', {
  messageId: data.telegramMessageId,
  channelId: data.channelId,
});

// Duplicate check
const existing = await this.jobRepo.findByMessageId(data.telegramMessageId);
if (existing) {
  Logger.debug('Job already exists', { messageId: data.telegramMessageId });
  return;
}

// Creation
const job = await this.jobRepo.create(jobData);
Logger.debug('Job created', { jobId: job._id, status: job.status });

// Async parse trigger
this.parseJobInBackground(job._id);
Logger.debug('Background parse triggered', { jobId: job._id });
```

### Example 2: Parser Flow

```typescript
// Parser invocation
Logger.debug('Parsing job text', { jobId, textLength: rawText.length });

// AI call
const aiResponse = await this.aiProvider.parseJob(rawText);
Logger.debug('AI Parser Response', {
  isJob: aiResponse.isJobPosting,
  skills: aiResponse.parsedData?.skills?.length,
});

// Not a job case
if (!aiResponse.isJobPosting) {
  Logger.debug('Message is not a job posting', {
    jobId,
    reason: aiResponse.reason,
  });
  return null;
}

// Success
Logger.debug('Job parsed successfully', {
  jobId,
  skills: parsedData.skills,
  jobType: parsedData.jobType,
});
```

### Example 3: Query Flow

```typescript
// Build filters
const filters = this.buildFilters(params, user);
Logger.debug('Job search filters constructed', {
  userId: user._id,
  channelCount: filters.channelIds.length,
  stack: filters.stack,
  jobTypes: filters.jobTypes,
});

// Execute query
const results = await this.jobRepo.findWithFilters(filters);
Logger.debug('Job search completed', {
  userId: user._id,
  resultCount: results.jobs.length,
  total: results.total,
});
```

## Environment-Based Behavior

```typescript
// Logger.debug only logs in development
if (envConfig.nodeEnv === 'development') {
  console.debug(this.formatMessage('DEBUG', message, metadata));
}

// Logger.error only captures to Sentry in production
if (envConfig.nodeEnv === 'production' && error) {
  Sentry.captureException(errorToCapture, options);
}
```

## Format

All logs use ISO timestamp format:

```
[2024-01-27T22:50:55.123Z] [DEBUG] Message | {"key":"value"}
[2024-01-27T22:50:56.456Z] [INFO] Server started | {"port":3001}
[2024-01-27T22:50:57.789Z] [ERROR] Parse failed | {"message":"...","stack":"..."}
```
