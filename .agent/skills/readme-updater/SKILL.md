---
name: readme-updater
description: Guide for updating README.md documentation. Use when adding features, changing architecture, modifying setup instructions, updating environment variables, or changing deployment process. Maintains README as single source of truth for the project.
---

# README Documentation Updater

Keep README.md accurate and comprehensive as single source of truth.

## When to Update README

Update README.md when:

- ✅ **Adding new features** or user flows
- ✅ **Changing directory structure** or architecture
- ✅ **Adding/removing major dependencies**
- ✅ **Modifying setup instructions**
- ✅ **Updating environment variables**
- ✅ **Changing deployment process**
- ✅ **Adding new npm scripts**
- ✅ **API endpoint changes** (new routes, modified contracts)
- ✅ **Security enhancements** (authentication, validation changes)

Don't update for:

- ❌ Minor bug fixes
- ❌ Code refactoring (same functionality)
- ❌ Internal implementation details
- ❌ Dependency version bumps

## Project README Structure

Current README follows this organization (972 lines):

1. **Title & Overview** (Lines 1-18)
   - Project name and tagline
   - Brief description of core capabilities
   - Value proposition

2. **Architecture & Approach** (Lines 20-193)
   - Design philosophy
   - 3-layer architecture diagram
   - Code organization structure
   - Key architectural decisions
   - Rationale for tech choices

3. **Tech Stack** (Lines 194-206)
   - Technology choices with rationale table
   - Layer-by-layer breakdown

4. **Features** (Lines 207-313)
   - Detailed feature list (11 main features)
   - Implementation details per feature

5. **API Endpoints** (Lines 314-598)
   - Complete API reference
   - Request/response examples
   - Organized by module

6. **Setup & Configuration** (Lines 599-707)
   - Prerequisites
   - Installation steps
   - Environment variables (comprehensive)
   - npm scripts reference

7. **Security Practices** (Lines 709-726)
   - Security checklist
   - Per-PR security requirements

8. **Development Workflow** (Lines 727-778)
   - Feature development process
   - Code style guidelines
   - Error handling patterns

9. **Database Schema** (Lines 780-972)
   - Collection schemas
   - Field descriptions
   - Indexes and relationships

## Update Patterns by Section

### 1. Adding New Feature

**Where to update:**

```markdown
## 🚀 Features

### Core Functionality

#### [N]. **Your New Feature Name**

- Brief description of capability
- Key implementation details
- Configuration options
- Usage notes
```

**Also update:**

- API Endpoints section (if new routes)
- Environment Variables (if new config needed)
- npm Scripts (if new commands)

**Example:**

```markdown
#### 12. **WebSocket Real-time Updates**

- Live job feed updates via Socket.IO
- Connection management with automatic reconnection
- Per-user room isolation
- Graceful fallback to polling
```

### 2. New API Endpoints

**Add to API section:**

````markdown
### [Module Name]

\```http
GET /api/module/endpoint # Description (auth/public)
POST /api/module/action # Action description (auth)
\```

**Request Example:**

\```json
{
"field": "value"
}
\```

**Response:**

\```json
{
"success": true,
"data": {}
}
\```
````

### 3. New Environment Variable

**Add to Environment Variables section:**

```markdown
# [Category Name]

NEW_VAR_NAME=default_value # Description of purpose
```

**Also update Required/Optional lists:**

```markdown
**Required Variables:**

- `NEW_VAR` - Purpose and when needed

**Optional Variables:**

- `NEW_VAR` - Optional feature enablement
```

### 4. Architecture Changes

**Update Code Organization section:**

```markdown
src/
├── modules/
│ └── new-module/ # Description
│ ├── new-module.controller.ts
│ ├── new-module.service.ts
│ └── new-module.routes.ts
```

**Also update:**

- Architecture diagram if layers change
- Key Architectural Decisions if pattern changes

### 5. New npm Script

**Add to Scripts section:**

```bash
npm run script-name          # Description of what it does
```

**Include:**

- Purpose
- When to use
- Example usage if complex

### 6. Dependency Changes

**Major dependency additions:**

Update Tech Stack table:

```markdown
| Layer         | Technology | Rationale                  |
| ------------- | ---------- | -------------------------- |
| **New Layer** | New Tool   | Why chosen, what it solves |
```

**Breaking changes:**

- Update Installation section
- Note migration steps
- Update Security Practices if relevant

### 7. Database Schema Changes

**Add/modify in Database Schema section:**

````typescript
### [Collection Name]

\```typescript
{
  newField: string (description)
  updatedField: {
    nested: boolean (default: false)
  }
}
\```
````

**Include:**

- Field types
- Validation rules
- Defaults
- Indexes

## Writing Style Guidelines

### Tone & Voice

- **Professional but approachable** - Senior engineer explaining to peers
- **Concise over verbose** - Every word earns its place
- **Actionable** - Readers should know what to do next

### Formatting Conventions

**Headers:**

```markdown
# Main Title (H1 - only one)

## Section (H2)

### Subsection (H3)

#### Feature Item (H4)
```

**Code blocks:**

- Always specify language: \`\`\`typescript, \`\`\`bash, \`\`\`json
- Include comments for clarity
- Show realistic examples, not placeholders

**Lists:**

- Use `✅` / `❌` for do/don't lists
- Keep items parallel in structure
- Order by importance or logical flow

**Emphasis:**

- **Bold** for key terms first mention
- `code` for variables, commands, file names
- _Italics_ sparingly for subtle emphasis

### Example Descriptions

**Good:**

```markdown
- **AI Job Parsing** - Extracts structured data from unstructured Telegram messages using Gemini/Abacus
- **Real-time Notifications** - Telegram bot alerts users when jobs match their saved filters
```

**Avoid:**

```markdown
- Parsing feature
- Notifications
```

## Update Workflow

### 1. Identify Changed Sections

Ask yourself:

- What functionality changed?
- Which README sections describe this?
- Are examples still accurate?

### 2. Update All Related Sections

Don't update in isolation. If adding feature:

- Features section (description)
- API Endpoints (if applicable)
- Environment Variables (if new config)
- Setup (if new steps required)

### 3. Maintain Consistency

- Keep numbering sequential
- Update cross-references
- Match existing tone/style
- Verify code examples compile

### 4. Verify Accuracy

**Before committing:**

- [ ] All code examples tested
- [ ] Environment variables match `.env.example`
- [ ] API examples match actual contracts
- [ ] npm scripts exist and work
- [ ] File paths are current
- [ ] Links resolve correctly

## Common Update Scenarios

### Scenario 1: Adding OAuth Provider

**Sections to update:**

1. Features → Add OAuth description
2. Tech Stack → Add OAuth library
3. API Endpoints → Add `/auth/oauth` routes
4. Environment Variables → Add OAuth credentials
5. Setup → OAuth setup steps

### Scenario 2: New Database Collection

**Sections to update:**

1. Features → Describe new capability
2. Code Organization → Add to modules structure
3. Database Schema → Full schema definition
4. API Endpoints → CRUD routes if exposed

### Scenario 3: Deployment Change

**Sections to update:**

1. Setup & Configuration → Deployment steps
2. Environment Variables → Platform-specific vars
3. Scripts → Deployment commands
4. Security → Platform security notes

## Quality Checklist

Before finalizing README updates:

- ✅ **Accuracy** - All info current and tested
- ✅ **Completeness** - No missing sections for new features
- ✅ **Clarity** - New developer can follow setup
- ✅ **Examples** - Code samples work as-is
- ✅ **Links** - All references resolve
- ✅ **Formatting** - Consistent markdown style
- ✅ **Line Length** - Reasonable (wrap at ~100 chars for readability)

## Backend Developer Integration

This skill complements `/.agent/workflows/backend-developer.md`:

**From workflow (lines 82-92):**

> Always update README.md at the end of the task if there are breaking changes, new technology, architecture changes, functionality changes, or user flow changes. The README must remain the single source of truth.

**Apply this skill when:**

- Backend workflow requires README update
- Major task completion (after implementation + testing)
- Documentation drift detected
- Onboarding feedback indicates confusion

## Template: Feature Addition

Use this template when adding new features:

````markdown
#### [N]. **Feature Name**

- **What**: Brief capability description
- **How**: Key implementation approach
- **Config**: Required environment variables (if any)
- **Details**:
  - Sub-feature 1
  - Sub-feature 2
  - Notable limitations or future improvements

**API Endpoints** (if applicable):

\```http
POST /api/feature/action # Description
\```

**Environment Variables** (if new):

\```env
FEATURE_API_KEY=your_key_here # Description
\```
````

## Anti-Patterns

**Avoid:**

❌ **Overly technical implementation details**

```markdown
Uses Observer pattern with EventEmitter to notify subscribers via pub/sub
```

✅ **User-focused capability**

```markdown
Real-time notifications via Telegram bot when jobs match filters
```

❌ **Vague feature lists**

```markdown
- Improved performance
- Better UX
```

✅ **Specific capabilities**

```markdown
- Reduced job search API response time from 800ms to 120ms via MongoDB indexing
- Autocomplete suggestions with <50ms latency using in-memory skill cache
```

❌ **Outdated examples**

```markdown
// Code that no longer works
```

✅ **Tested, current examples**

```markdown
// Verified working code
```

## README as Living Document

The README is NOT:

- Set in stone after initial write
- Documentation for documentation's sake
- A historical changelog

The README IS:

- **Current state** of the project
- **Single source of truth** for setup
- **First thing** new developers/contributors read
- **Reflection** of actual codebase, not aspirations

**Update it. Keep it current. Make it useful.**
