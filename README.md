# Telegram Job Scraper Backend

**AI-powered job aggregation platform** that monitors Telegram channels, parses job postings with AI, generates tailored resumes, and sends real-time notifications for matching opportunities.

## 🎯 Overview

Comprehensive job discovery and application automation system:

- **Aggregates** job postings from Telegram channels in real-time
- **Parses** unstructured posts into structured data using AI (Gemini/Abacus)
- **Filters** jobs by tech stack, experience, location, and custom criteria
- **Tailors** resumes automatically for each job using AI
- **Generates** professional PDF/DOCX resumes optimized for positions
- **Notifies** users via Telegram bot when matching jobs appear
- **Tracks** user interactions (views, applications) for insights
- **Provides** platform statistics and curated channel bundles

Full-stack backend service eliminating manual job hunting and resume customization.

## 🏗️ Architecture & Approach

### Design Philosophy

I follow a **pragmatic, layered architecture** with these core principles:

1. **Separation of Concerns** - Clean 3-layer architecture (Controller → Service → Repository)
2. **Type Safety** - Strict TypeScript with comprehensive type definitions
3. **Error Handling** - Custom error classes with operational vs programmer error distinction
4. **Modularity** - Feature-based module organization for scalability
5. **Path Aliases** - Clean imports using `@config`, `@modules`, `@utils` etc.
6. **Lean Codebase** - Remove unused code, flags, and endpoints aggressively

### 3-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Layer                           │
│  Controllers: Handle requests, validate input, format output│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic                         │
│   Services: Orchestrate operations, implement core logic    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Access                            │
│  Repositories: Database operations, query abstraction       │
└─────────────────────────────────────────────────────────────┘
```

**Why this approach?**

- **Testability**: Each layer can be tested independently
- **Maintainability**: Changes to one layer don't cascade
- **Reusability**: Services can be composed, repositories shared
- **Clarity**: Clear responsibility boundaries

### Code Organization

```
src/
├── index.ts                    # App entry: middleware, routes, startup
├── modules/                    # Feature modules (domain-driven)
│   ├── bundle/                # Channel bundles (onboarding packs)
│   │   ├── bundle.controller.ts
│   │   ├── bundle.service.ts
│   │   ├── bundle.model.ts
│   │   ├── bundle.routes.ts
│   │   └── bundle.seed.ts     # Bundle seeding
│   ├── channel/               # Telegram channel management
│   │   ├── channel.controller.ts
│   │   ├── channel.service.ts
│   │   ├── channel.repository.ts
│   │   ├── channel.model.ts
│   │   ├── channel.routes.ts
│   │   ├── channel.types.ts
│   │   ├── channel.config.ts  # Recommended channels
│   │   ├── channel.seed.ts    # Database seeding
│   │   └── channel.cleanup.ts # Data maintenance
│   ├── feedback/              # User feedback collection
│   │   ├── feedback.controller.ts
│   │   ├── feedback.model.ts
│   │   └── feedback.routes.ts
│   ├── job/                   # Job feed & filtering
│   │   ├── job.controller.ts  # Advanced filter handling
│   │   ├── job.service.ts     # Business logic + AI parsing
│   │   ├── job.repository.ts  # Complex MongoDB queries
│   │   ├── job.model.ts       # Mongoose schema
│   │   ├── job.routes.ts
│   │   ├── job.types.ts       # Filter options, DTOs
│   │   └── job-cleanup.service.ts # Cleanup old jobs
│   ├── notification/          # Telegram notification system
│   │   ├── notification.controller.ts
│   │   ├── notification.service.ts
│   │   ├── notification.routes.ts
│   │   └── telegram-bot.service.ts # Bot instance
│   ├── resume/                # Resume upload & parsing
│   │   ├── resume.controller.ts
│   │   ├── resume.service.ts
│   │   └── resume.routes.ts
│   ├── scraper/               # Background job scraper
│   │   ├── scraper.service.ts
│   │   └── page-scraper.service.ts # External page scraping
│   ├── sniper/                # AI resume tailoring
│   │   ├── sniper.controller.ts
│   │   ├── sniper.service.ts  # Orchestration
│   │   ├── sniper.routes.ts
│   │   └── sniper.validator.ts
│   ├── stats/                 # Platform statistics
│   │   ├── stats.controller.ts
│   │   ├── stats.service.ts
│   │   └── stats.routes.ts
│   ├── telegram/              # GramJS listener service
│   │   └── telegram.service.ts
│   └── user/                  # User management & preferences
│       ├── user.model.ts
│       ├── user.routes.ts
│       ├── user-preferences.controller.ts
│       └── user-preferences.service.ts
├── migrations/                # Database migrations
├── scripts/                   # Utility scripts
└── shared/                    # Cross-cutting concerns
    ├── config/                # Environment & database
    │   ├── env.config.ts      # Centralized env vars
    │   └── database.config.ts # MongoDB connection
    ├── constants/             # App constants
    ├── middlewares/           # Express middleware
    │   ├── auth.middleware.ts # JWT verification
    │   ├── error.middleware.ts # Global error handler
    └── queue/                 # Background job queue (BullMQ + Redis)
        ├── job-queue.service.ts # Queue management singleton
        ├── queue.types.ts     # Job payload types
        └── tests/             # Queue unit tests
    │   └── validation.middleware.ts # Joi schemas
    ├── providers/             # External service integrations
    │   └── ai/                # AI providers (Gemini, Abacus)
    ├── types/                 # Shared TypeScript types
    └── utils/                 # Utilities
        ├── logger.ts          # Structured logging
        ├── errors.ts          # Custom error classes
        └── response.ts        # Standardized API responses
```

### Key Architectural Decisions

#### 1. **Module Structure**

Each module is **self-contained** with all related files:

- **Why?** Easier to understand, modify, and potentially extract into microservices
- **Pattern**: `[feature].[layer].ts` naming convention

#### 2. **Path Aliases**

Using TypeScript path mapping (`@modules/*`, `@config/*`, etc.):

```typescript
// ❌ Bad: Relative imports
import { Logger } from '../../../shared/utils/logger';

// ✅ Good: Clean aliases
import { Logger } from '@utils/logger';
```

#### 3. **Error Handling Strategy**

Custom error classes extend `AppError` with HTTP status codes:

```typescript
throw new NotFoundError('Job not found'); // 404
throw new BadRequestError('Invalid filter'); // 400
throw new UnauthorizedError('Token expired'); // 401
```

- **Operational errors** (user mistakes) → Handled gracefully
- **Programmer errors** (bugs) → Logged with stack traces

#### 4. **Service Composition**

Complex services delegate to specialized sub-services:

```typescript
// sniper.service.ts orchestrates:
// - ai-tailor.service.ts (AI calls)
// - pdf-generator.service.ts (PDF creation)
// - docx-generator.service.ts (DOCX creation)
```

#### 5. **Type Safety**

Strict TypeScript with:

- Interface definitions for all DTOs
- Type guards for runtime validation
- Mongoose schema types matching TypeScript interfaces

## 🛠️ Tech Stack

| Layer               | Technology                               | Rationale                                               |
| ------------------- | ---------------------------------------- | ------------------------------------------------------- |
| **Runtime**         | Node.js + TypeScript                     | Type safety, modern async/await patterns                |
| **Framework**       | Express.js                               | Lightweight, flexible, extensive middleware ecosystem   |
| **Database**        | MongoDB Atlas + Mongoose                 | Flexible schema for unstructured job data, cloud-hosted |
| **Telegram**        | GramJS                                   | Official Telegram client library for Node.js            |
| **AI**              | Abacus.ai API                            | Job parsing & resume tailoring with LLMs                |
| **Auth**            | JWT + bcrypt                             | Stateless authentication, secure password hashing       |
| **File Processing** | multer, pdf-parse, mammoth, pdfkit, docx | Multi-format resume handling                            |
| **Validation**      | Joi                                      | Schema-based request validation                         |

## 🚀 Features

### Core Functionality

#### 1. **Telegram Channel Monitoring**

- Real-time message listening via GramJS
- Auto-join recommended channels on first run
- Persistent session management
- Graceful reconnection on network failures
- Optional scraper disable flag for production (`DISABLE_SCRAPER`)

#### 2. **AI Job Parsing**

- Extracts structured data from unstructured Telegram messages:
  - Job title, company, salary
  - Tech stack (array of technologies)
  - Experience level (Junior/Mid/Senior)
  - Location type (Remote/Hybrid/Onsite)
  - Job function (Frontend/Backend/Full Stack/etc.)
  - Years of experience (min/max)
- Dual AI provider support: Gemini (default) or Abacus.ai
- External page scraping for digest messages with links

#### 3. **Advanced Job Filtering**

- **Tech Stack**: Multi-select with autocomplete
- **Experience Level**: Junior/Mid/Senior
- **Location Type**: Remote/Hybrid/Onsite
- **Job Function**: Frontend/Backend/Full Stack/DevOps/etc.
- **Experience Years**: Min/Max range
- **Excluded Titles**: Blacklist specific roles
- **Mute Keywords**: Filter out unwanted terms
- POST-based search with complex filter bodies
- Pagination support

#### 4. **Resume Management**

- Upload master resume (PDF/DOCX)
- Automatic text extraction (pdf-parse, mammoth)
- Storage in MongoDB + file system
- File type validation and size limits

#### 5. **AI Resume Tailoring (Sniper)**

- Analyzes job requirements vs. master resume
- Generates customized:
  - Resume summary
  - Skills section
  - Cover letter
  - Telegram application message
- Exports to PDF and DOCX
- Request validation via Joi schemas

#### 6. **Telegram Notification System**

- **Telegram Bot Integration** (always runs in production)
  - Real-time job notifications via bot
  - Subscription via unique tokens
  - `/start` command with subscription link
  - Webhook support for production deployments
- **Notification Settings**
  - Enable/disable notifications
  - Custom filter preferences per user
  - Quiet hours configuration with timezone support
  - Test notification endpoint
- **Smart Filtering**
  - Match jobs against user's saved filters
  - Prevent duplicate notifications
  - Track notification count and last sent time

#### 7. **Channel Bundles (Onboarding)**

- Curated channel packs for new users
- Category-based organization
- Dynamic bundle data from backend
- Auto-seeding on server startup

#### 8. **User Interaction Tracking**

- Mark jobs as viewed
- Track subscription changes
- Monthly swap limits for free tier (6 swaps/month)
- Onboarding completion status
- Notification preferences persistence

#### 9. **Platform Statistics**

- Public stats endpoint (no auth)
- Total jobs, channels, users
- Recent activity metrics
- Growth indicators

#### 10. **Feedback System**

- Authenticated user feedback submission
- Structured feedback collection
- Future analytics potential

#### 11. **Job Archive Service**

- Automatic archival of jobs older than 7 days
- Separate `archived_jobs` collection with metadata-only (no heavy text fields)
- Preserves job statistics and SEO data while keeping active collection lean
- Per-job error handling with retry mechanism
- Runs on daily schedule

## 📡 API Endpoints

### Jobs

```http
POST /api/jobs/search              # Search jobs with filters (authenticated)
GET  /api/jobs/:id                 # Get job details
POST /api/jobs/:id/view            # Mark job as viewed
GET  /api/jobs/skills/search       # Autocomplete tech skills
GET  /api/jobs/functions/search    # Autocomplete job functions
```

**Example Search Request:**

```json
POST /api/jobs/search
{
  "stack": ["react", "typescript"],
  "level": ["Mid", "Senior"],
  "locationType": ["Remote"],
  "jobFunction": ["Frontend"],
  "experienceYears": { "min": 2, "max": 5 },
  "limit": 20,
  "offset": 0
}
```

### Channels

```http
GET  /api/channels/available       # Get all channels server monitors (auth)
GET  /api/channels/user-channels   # Get user's subscribed channels (auth)
GET  /api/channels/recommended     # Get recommended channels (public)
GET  /api/channels/categories      # Get all categories (public)
GET  /api/channels/explore         # Explore channels modal data (auth)
POST /api/channels/search          # Search channels by query (auth)
POST /api/channels/subscribe       # Subscribe to channels (auth)
POST /api/channels/add             # Add channels to subscription (auth)
POST /api/channels/unsubscribe     # Unsubscribe from channel (auth)
```

### Bundles (Onboarding)

```http
GET  /api/bundles                  # Get all channel bundles (public)
GET  /api/bundles/:id              # Get bundle by ID (public)
```

### User Preferences

```http
GET  /api/users/preferences/filters    # Get saved filter preferences (auth)
PUT  /api/users/preferences/filters    # Save filter preferences (auth)
```

### Resume

```http
POST /api/resume/upload            # Upload master resume (multipart/form-data, auth)
```

**Request:**

```bash
curl -X POST http://localhost:4000/api/resume/upload \
  -H "Authorization: Bearer <token>" \
  -F "resume=@/path/to/resume.pdf"
```

### Sniper (Resume Tailoring)

```http
POST /api/sniper/generate          # Generate tailored resume (auth)
```

**Request Body:**

```json
{
  "jobId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pdfUrl": "/temp/resume_123.pdf",
    "docxUrl": "/temp/resume_123.docx",
    "telegramMessage": "Hi! I'm applying for...",
    "coverLetter": "Dear Hiring Manager..."
  }
}
```

### Notifications

```http
GET  /api/notifications/settings           # Get notification settings (auth)
POST /api/notifications/settings           # Update notification settings (auth)
POST /api/notifications/test               # Send test notification (auth)
POST /api/notifications/generate-link      # Generate subscription link (auth)
POST /api/notifications/telegram/webhook   # Telegram bot webhook (public, validated)
```

**Update Settings Request:**

```json
{
  "enabled": true,
  "filters": {
    "stack": ["react", "node"],
    "level": ["Mid"],
    "locationType": ["Remote"]
  },
  "quietHours": {
    "enabled": true,
    "startHour": 22,
    "endHour": 8,
    "timezone": "America/New_York"
  }
}
```

### Feedback

```http
POST /api/feedback                 # Submit user feedback (auth)
```

### Payment (LemonSqueezy)

```http
POST /api/payment/checkout         # Create checkout session (auth)
GET  /api/payment/subscription     # Get subscription status (auth)
POST /api/payment/cancel           # Cancel subscription (auth)
POST /api/payment/resume           # Resume cancelled subscription (auth)
POST /api/payment/webhook          # LemonSqueezy webhook (public, signature validated)
```

**Payment Features:**

- Premium subscription management via LemonSqueezy
- Secure checkout session creation
- Automatic webhook processing for payment events (subscription.created, subscription.updated, subscription.cancelled, subscription.expired, order.created)
- Subscription status tracking with period end dates
- Graceful subscription cancellation (access until period ends)
- Resume cancelled subscriptions before period ends

**Create Checkout Request:**

```json
POST /api/payment/checkout
{
  "variantId": "123456"  // LemonSqueezy product variant ID
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://store.lemonsqueezy.com/checkout/..."
  }
}
```

**Subscription Status Response:**

```json
{
  "plan": "premium",
  "status": "active",
  "currentPeriodEnd": "2024-02-15T00:00:00.000Z",
  "cancelAtPeriodEnd": false
}
```

**Cancel Subscription:**

- Subscription remains active until current billing period ends
- `cancelAtPeriodEnd` flag indicates pending cancellation
- User retains premium access through paid period
- Payment record updated with `cancelledAt` timestamp

**Resume Subscription:**

- Reactivates cancelled subscriptions before period ends
- Validates subscription has `cancelledAt` date set
- Calls LemonSqueezy API to uncancel subscription
- Clears `cancelledAt` and restores active status

### Platform Statistics

```http
GET  /api/stats/platform           # Get platform statistics (public)
```

**Response:**

```json
{
  "activeChannels": 42,
  "jobsLast7Days": 156,
  "totalJobs": 15243
}
```

**Note**: `totalJobs` includes both active jobs and archived historical jobs.

### SEO Market Insights

```http
GET  /api/market-insights/page/:slug       # Get insights page data by slug (public)
GET  /api/market-insights/slugs            # Get all page slugs (public)
```

**Get Page Data:**

```http
GET /api/market-insights/page/python?locale=en
```

**Response:**

```json
{
  "success": true,
  "data": {
    "config": { "slug": "python", "template": "category-only" },
    "meta": {
      "h1": "Python Job Market Insights - Live Data from Telegram",
      "title": "Python Jobs Worldwide - Market Stats & Trends | JobSniper",
      "description": "Comprehensive Python job market analysis..."
    },
    "faq": [
      {
        "question": "What is the average Python developer salary?",
        "answer": "Based on 300+ analyzed jobs..."
      }
    ],
    "stats": {
      "totalJobs": 72,
      "jobsLast7Days": 66,
      "avgSalary": null,
      "topSkills": [{"skill": "Django", "count": 45}, ...],
      "salaryBands": [{"range": "$3000-$4000", "count": 15}, ...],
      "experienceLevels": [{"level": "Mid", "count": 35}, ...],
      "trendData": [{"date": "2026-01-06", "jobs": 8}, ...],
      "updatedAt": "0 minutes ago"
    },
    "jobs": [/* Recent job postings */]
  }
}
```

**Get All Slugs:**

```http
GET /api/market-insights/slugs
```

**Response:**

```json
{
  "success": true,
  "data": {
    "slugs": ["python", "javascript", "react", "node", ...]
  }
}
```

**Features:**

- Public endpoints (no authentication)
- Real-time statistics aggregation
- Multi-locale support (en/ru)
- 7-day trend analysis
- ISR-friendly for Next.js client

## ⚙️ Setup & Configuration

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Abacus.ai API key
- (Optional) Telegram API credentials

## 🔐 Security Practices

- ✅ **JWT Authentication** - Stateless, secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Input Validation** - Joi schemas on all endpoints
- ✅ **File Type Validation** - Restrict uploads to PDF/DOCX
- ✅ **CORS Configuration** - Whitelist frontend origin
- ✅ **Environment Secrets** - Never commit `.env` files
- ✅ **Error Message Sanitization** - Hide stack traces in production
- ✅ **Sentry Error Monitoring** - Real-time error tracking for dev and production environments

## 🧪 Development Workflow

### Error Handling Pattern

```typescript
// ✅ Good: Throw custom errors, let middleware handle
async getJob(id: string) {
  const job = await this.repository.findById(id);
  if (!job) throw new NotFoundError('Job not found');
  return job;
}

// ❌ Bad: Try-catch in every function
async getJob(id: string) {
  try {
    const job = await this.repository.findById(id);
    if (!job) return null;
    return job;
  } catch (err) {
    console.error(err);
    return null;
  }
}
```

## 🧪 Testing

The project maintains comprehensive test coverage using **Jest**, **Supertest**, and **MongoDB Memory Server**.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Architecture

- **Unit Tests**: Focus on Services and utilities, mocking dependencies/repositories.
- **Integration Tests**: Focus on Routes/Controllers, using an in-memory MongoDB instance to verify end-to-end flows.
- **CI/CD**: Tests run automatically on every push/PR via GitHub Actions.

## 🧹 Linting & Code Style

The project uses **ESLint** and **Prettier** to ensure code quality and consistent formatting.

- **Pre-commit Hooks**: **Husky** ensures that all staged files are linted and formatted before committing.
- **Auto-fix**: `npm run format` (or the pre-commit hook) will automatically fix most issues including import sorting.

## 📝 License

MIT

## 👤 Author

**werty.potom**

---

**Built with a focus on pragmatism, type safety, and developer experience.**
