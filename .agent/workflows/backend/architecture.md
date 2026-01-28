# Architecture & Code Standards

Follow project's 3-layer architecture and conventions.

## Module Structure

```
src/modules/[feature]/
├── [feature].controller.ts   # HTTP handling, validation, status codes
├── [feature].service.ts      # Business logic orchestration
├── [feature].repository.ts   # Database queries (Mongoose)
├── [feature].model.ts        # Mongoose schema
├── [feature].routes.ts       # Route definitions
└── [feature].types.ts        # DTOs, interfaces
```

### Layer Responsibilities

**Controller**:

- Input validation (Joi schemas)
- HTTP status mapping
- Request/response formatting
- Delegate to service

**Service**:

- Core business logic
- Orchestrate multiple repositories
- Transaction management
- Throw domain errors

**Repository**:

- Database operations
- Query abstraction
- Mongoose-specific logic
- Return domain objects

## Naming Convention

`[feature].[layer].ts` pattern:

```typescript
// ✅ Good
job.service.ts;
user.repository.ts;
channel.controller.ts;

// ❌ Bad
jobService.ts;
userRepo.ts;
channelAPI.ts;
```

## TypeScript Standards

### Type Definitions

```typescript
// ✅ Use interface for data structures
interface CreateJobDto {
  channelId: string;
  rawText: string;
  telegramMessageId: string;
}

// ✅ Use type for unions/intersections
type JobStatus = 'pending_parse' | 'parsed' | 'failed';
type UserPlan = 'free' | 'premium';

// ❌ No any - Zero tolerance
const data: any = await fetch(); // FORBIDDEN

// ✅ Explicit return types on public methods
async getJobFeed(filters: JobFilters): Promise<JobFeedResponse> {
  // ...
}
```

### Type Safety

- **No `any`** - Use `unknown` if truly unknown, then narrow
- **Strict null checks** - Handle null/undefined explicitly
- **Interface > Type** for object shapes
- **Type guards** for runtime validation

## Error Handling

```typescript
// ✅ Throw custom errors, let middleware handle
async getJob(id: string): Promise<Job> {
  const job = await this.repository.findById(id);
  if (!job) throw new NotFoundError('Job not found');
  return job;
}

// ❌ Don't catch unless wrapping/enriching
async getJob(id: string): Promise<Job | null> {
  try {
    return await this.repository.findById(id);
  } catch (err) {
    console.error(err);
    return null;
  }
}
```

### Error Classes

Use `AppError` subclasses:

- `NotFoundError` - 404
- `BadRequestError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `ConflictError` - 409

Let global error handler catch them in middleware.

## Path Aliases

Use clean imports via tsconfig paths:

```typescript
// ✅ Good - Clean aliases
import { Logger } from '@utils/logger';
import { UserRepository } from '@modules/user/user.repository';
import { envConfig } from '@config/env.config';

// ❌ Bad - Relative imports
import { Logger } from '../../../shared/utils/logger';
import { UserRepository } from '../../user/user.repository';
```

## Code Style

- **Concise over verbose** - Sacrifice grammar for brevity
- **Early returns** - Guard clauses over nested ifs
- **Async/await** - No callback hell
- **Functional patterns** - Prefer map/filter over loops
- **Explicit types** - Let TypeScript help you

## Service Composition

Complex services delegate to sub-services:

```typescript
// sniper.service.ts orchestrates:
class SniperService {
  constructor(
    private aiTailorService: AiTailorService,
    private pdfGenerator: PdfGeneratorService,
    private docxGenerator: DocxGeneratorService
  ) {}

  async generateTailoredResume(jobId: string, userId: string) {
    const tailored = await this.aiTailorService.tailor(job, resume);
    const pdf = await this.pdfGenerator.generate(tailored);
    const docx = await this.docxGenerator.generate(tailored);
    return { pdf, docx, tailored };
  }
}
```

## References

- See README.md "Architecture & Approach" section for detailed rationale
- Check existing modules for patterns
- Follow project's established conventions
