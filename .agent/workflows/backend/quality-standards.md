# Quality Standards

Maintain zero-tolerance policy for code quality issues.

## Zero-Tolerance Policy

**FORBIDDEN** to commit code with:

- ❌ ESLint errors
- ❌ TypeScript type errors
- ❌ Unused variables or imports
- ❌ Leftover debug code

## Pre-Commit Checklist

Run before requesting review:

```bash
npm run lint              # ESLint check - must pass
npm run check-types       # TypeScript compilation - must pass
npm test                  # Test suite - must pass
npm run format            # Auto-fix formatting (optional)
```

**All must pass.** Fix issues before presenting code.

## Testing Requirements

Use [unit-test-writer skill](../../skills/unit-test-writer/) for guidance.

### What to Test

- ✅ **Service logic** - Business rules, edge cases
- ✅ **Repository queries** - Integration tests with MongoDB Memory Server
- ✅ **Route handlers** - Integration tests with supertest
- ✅ **Error handling** - Invalid inputs, not found, permissions
- ✅ **Business constraints** - Plan limits, quotas, validation

### Test Coverage Goals

- Service methods: Unit tests with mocked dependencies
- Routes: Integration tests with real DB (in-memory)
- Edge cases: Null handling, boundary conditions
- Error cases: Expected failures

### Example

```typescript
describe('JobService', () => {
  describe('getJobFeed', () => {
    it('should enforce user channel subscriptions');
    it('should limit free tier users to 5 channels');
    it('should mark viewed jobs correctly');
    it('should throw NotFoundError when user not found');
  });
});
```

## Linting & Formatting

**ESLint rules:**

- No unused imports
- Consistent import ordering (simple-import-sort)
- Explicit return types on exported functions
- No `any` types

**Prettier rules:**

- 100 character line length
- Single quotes
- Trailing commas
- 2-space indentation

## Debugging & Cleanup

Use [nodejs-debugger skill](../../skills/nodejs-debugger/) when investigating issues.

**Mandatory cleanup before commit:**

```bash
# Search for debug markers
grep -r "// DEBUG" src/

# Find debug scripts
find src/scripts -name "debug-*.ts"

# Find console.log statements
grep -r "console.log" src/ | grep -v node_modules
```

**Remove all:**

- `// DEBUG:` markers and associated code
- `debug-*.ts` temporary scripts
- `console.log()` statements
- Test data inserted for debugging

## Database Migrations

Use [migration-writer skill](../../skills/migration-writer/) for schema changes.

**Requirements:**

- Migration for every schema change
- Up and down implementations
- Tested rollback path
- Batch processing for large datasets

## Code Quality Principles

1. **Readability** - Code is read more than written
2. **Simplicity** - Simplest solution that works
3. **Testability** - Easy to test = good design
4. **Maintainability** - Future you should thank current you
5. **Performance** - Optimize hot paths, not everything

## When in Doubt

- Check existing code patterns
- Reference README.md architecture
- Ask for review before major changes
- Prefer proven patterns over clever solutions
