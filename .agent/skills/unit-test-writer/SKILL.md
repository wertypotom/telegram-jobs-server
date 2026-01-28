---
name: unit-test-writer
description: Guide for writing unit tests using Jest in the backend server. Use when creating tests for services, routes, repositories, or any backend logic. Covers mocking, test structure, MongoDB in-memory testing, assertions, and integration patterns following project conventions.
---

# Unit Test Writer

Write comprehensive unit tests following project patterns and Jest best practices.

## Test Framework Stack

- **Test Runner**: Jest with ts-jest preset
- **Assertions**: Jest matchers
- **HTTP Testing**: supertest for route tests
- **Database**: mongodb-memory-server for isolated test DB
- **Mocking**: jest.mock() for dependencies

## File Structure

Place tests in `tests/` folder within each module:

```
src/modules/[module]/
├── [module].service.ts
├── [module].routes.ts
└── tests/
    ├── [module].service.test.ts
    └── [module].routes.test.ts
```

## Test File Template

### Service Tests

```typescript
import { ServiceName } from '../service-name.service';
import { DependencyRepository } from '../dependency.repository';

// Mock all dependencies
jest.mock('../dependency.repository');
jest.mock('@utils/logger');

describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependencyRepo: jest.Mocked<DependencyRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServiceName();
    mockDependencyRepo = (DependencyRepository as unknown as jest.Mock).mock.instances[0];
  });

  describe('methodName', () => {
    const mockData = {
      // Test data
    };

    it('should handle success case', async () => {
      mockDependencyRepo.findById.mockResolvedValue({ _id: 'test' } as any);

      const result = await service.methodName(mockData);

      expect(mockDependencyRepo.findById).toHaveBeenCalledWith('test');
      expect(result).toBeDefined();
    });

    it('should handle error case', async () => {
      mockDependencyRepo.findById.mockResolvedValue(null);

      await expect(service.methodName(mockData)).rejects.toThrow(/error message/);
    });
  });
});
```

### Route/Integration Tests

```typescript
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';
import { ServiceRepository } from '../service.repository';

// Mock next-auth
jest.mock('next-auth/jwt');

describe('Module Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: 'test@example.com',
    });
  });

  describe('GET /api/endpoint', () => {
    beforeEach(async () => {
      // Seed test data
      const repo = new ServiceRepository();
      await repo.create({
        /* test data */
      } as any);
    });

    it('should return data', async () => {
      const response = await request(app).get('/api/endpoint');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });
});
```

## Core Patterns

### Mocking Dependencies

**Constructor injection mocking:**

```typescript
jest.mock('../repository');
let mockRepo: jest.Mocked<Repository>;

beforeEach(() => {
  service = new Service();
  mockRepo = (Repository as unknown as jest.Mock).mock.instances[0];
});
```

**Mock return values:**

```typescript
// Resolved promise
mockRepo.findById.mockResolvedValue({ _id: 'id' } as any);

// Rejected promise
mockRepo.create.mockRejectedValue(new Error('DB error'));

// Multiple calls with different returns
mockRepo.findByUsername.mockResolvedValueOnce({ _id: 'valid' } as any).mockResolvedValueOnce(null);
```

**Suppress logger output:**

```typescript
jest.mock('@utils/logger');
```

Global setup in `src/shared/tests/setup.ts` already mutes logger in `beforeEach`.

### Test Organization

**Group related tests:**

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => {});
    it('should handle edge case', () => {});
    it('should throw error when invalid', () => {});
  });
});
```

**Setup/teardown:**

- `beforeEach`: Reset mocks, create service instance
- `afterEach`: DB cleanup (handled globally in setup.ts)
- Don't manually call `jest.clearAllMocks()` (configured in jest.config.ts)

### Assertions

**Common matchers:**

```typescript
// Equality
expect(result).toBe(expectedPrimitive);
expect(result).toEqual(expectedObject);

// Truthiness
expect(result).toBeDefined();
expect(result).toBeNull();
expect(result.field).toBe(true);

// Arrays/Objects
expect(array).toHaveLength(5);
expect(array).toContain(item);
expect(array).toEqual(expect.arrayContaining([item1]));
expect(obj).toEqual(expect.objectContaining({ key: value }));

// Functions called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).not.toHaveBeenCalled();

// Strings/Regex
expect(message).toMatch(/pattern/);

// Numeric
expect(count).toBeGreaterThan(0);
expect(count).toBeLessThanOrEqual(10);

// Errors
await expect(service.method()).rejects.toThrow(/error message/);
```

### Testing Business Logic

**Plan limit enforcement:**

```typescript
it('should limit free tier users to 5 channels', async () => {
  mockUserRepo.findById.mockResolvedValue({
    plan: 'free',
    subscribedChannels: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'],
  } as any);

  await service.getJobFeed({ limit: 10 }, 'user-1');

  const callArgs = mockRepo.findWithFilters.mock.calls[0][0];
  expect(callArgs.channelIds).toHaveLength(5);
});
```

**Duplicate detection:**

```typescript
it('should ignore duplicate jobs', async () => {
  mockRepo.findByMessageId.mockResolvedValue({ _id: 'existing' } as any);

  await service.createJob(mockJobData);

  expect(mockRepo.create).not.toHaveBeenCalled();
});
```

**State transformations:**

```typescript
it('should mark viewed jobs correctly', async () => {
  mockUserRepo.findById.mockResolvedValue({ viewedJobs: ['job-1'] } as any);
  const mockJobs = [{ _id: 'job-1' }, { _id: 'job-2' }];
  mockRepo.findWithFilters.mockResolvedValue({ jobs: mockJobs as any, total: 2 });

  const result = await service.getJobFeed({ limit: 10 }, 'user-1');

  expect(result.jobs[0].isVisited).toBe(true);
  expect(result.jobs[1].isVisited).toBe(false);
});
```

### Integration Tests

**Seeding data:**

```typescript
beforeEach(async () => {
  const userRepo = new UserRepository();
  await userRepo.create({
    _id: mockUserId,
    email: 'test@example.com',
    subscribedChannels: ['channel-1'],
  } as any);

  const jobRepo = new JobRepository();
  await jobRepo.create({
    channelId: 'channel-1',
    status: 'parsed',
    rawText: 'Job description',
  } as any);
});
```

**HTTP requests:**

```typescript
// GET
const response = await request(app).get('/api/jobs/search?q=node');

// POST
const response = await request(app)
  .post('/api/jobs/search')
  .send({ stack: ['React'] });

// Assertions
expect(response.status).toBe(200);
expect(response.body.data).toBeDefined();
```

**DB verification after mutation:**

```typescript
it('should update user in database', async () => {
  await request(app).post(`/api/jobs/${jobId}/view`);

  const userRepo = new UserRepository();
  const user = await userRepo.findById(mockUserId);
  expect(user?.viewedJobs).toContain(jobId);
});
```

## Test Coverage Checklist

For each method/route, write tests for:

- ✅ **Happy path** - Normal successful execution
- ✅ **Edge cases** - Boundary conditions, empty inputs, limits
- ✅ **Error cases** - Invalid data, not found, permission denied
- ✅ **Business logic** - Plan limits, duplicate detection, state transitions
- ✅ **Side effects** - Verify DB updates, async calls triggered
- ✅ **Integration** - End-to-end API flow with real DB

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Common Pitfalls

❌ **Don't** use real external services (Telegram, AI APIs)
✅ **Do** mock all external dependencies

❌ **Don't** rely on test execution order
✅ **Do** ensure each test is independent

❌ **Don't** test implementation details
✅ **Do** test behavior and outcomes

❌ **Don't** create complex test data inline
✅ **Do** use descriptive mock data constants

❌ **Don't** use `any` everywhere
✅ **Do** use minimal `as any` only for mock data structures
