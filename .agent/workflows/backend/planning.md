# Implementation Planning

**NEVER** push straight to implementation. Plan comprehensively first.

## Plan Structure

Break task into **Subtasks**. For each subtask:

### 1. Evaluation

Analyze impact:

- What files will change?
- What are the risks?
- Breaking changes?
- Dependencies affected?

### 2. Implementation Steps

Logical sequence of changes:

1. Create Interface/Type definitions
2. Update Repository layer
3. Implement Service logic
4. Add Controller endpoints
5. Register routes

### 3. Testing Scenarios

**Automated** (use [unit-test-writer skill](../../skills/unit-test-writer/)):

- Which unit tests to write/update?
- Integration test scenarios
- Edge cases to cover

**Manual**:

- How user verifies (e.g., "Hit endpoint POST /api/x with body Y")
- Expected response
- Error scenarios to test

### 4. Edge Cases

Explicit "what if" list:

- Null/undefined inputs
- Database timeouts
- Third-party API failures
- Race conditions
- Invalid data formats
- Permission boundaries

### 5. Future Improvements

V2 considerations:

- Performance optimizations
- Feature enhancements
- Technical debt to address later
- Alternative approaches considered

## Example Plan

```markdown
### Subtask 1: Add Job Filtering by Salary Range

**Evaluation:**

- Files: job.types.ts, job.repository.ts, job.service.ts, job.controller.ts
- Risk: Low - additive change, no breaking changes
- Dependencies: None

**Implementation Steps:**

1. Add salary range types to job.types.ts
2. Update findWithFilters() in repository to handle salary filter
3. Extend getJobFeed() in service to accept salary params
4. Add salary validation in controller
5. Update API docs in README.md

**Testing:**

- Automated: Unit test repository filter logic, service integration test
- Manual: POST /api/jobs/search with {"salaryMin": 50000, "salaryMax": 100000}

**Edge Cases:**

- salaryMin > salaryMax (validation error)
- Null salary in job data (exclude or include?)
- Only min or only max provided
- Non-numeric values

**Future:**

- Currency normalization (USD vs EUR)
- Cost of living adjustments by location
```

## Before Implementation

- [ ] Read README.md architecture section
- [ ] Check existing patterns in similar modules
- [ ] Identify reusable code
- [ ] Consider backward compatibility
