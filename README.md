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

#### 11. **Job Cleanup Service**

- Automatic removal of old jobs (>7 days)
- Runs on schedule (every 7 days)
- Keeps database lean

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
POST /api/payment/webhook          # LemonSqueezy webhook (public, signature validated)
```

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

### Platform Statistics

```http
GET  /api/stats/platform           # Get platform statistics (public)
```

**Response:**

```json
{
  "totalJobs": 15243,
  "totalChannels": 42,
  "totalUsers": 1523,
  "activeUsers": 342,
  "jobsLast24h": 156
}
```

## ⚙️ Setup & Configuration

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Abacus.ai API key
- (Optional) Telegram API credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure .env (see below)
# Start development server
npm run dev
```

### Environment Variables

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Disable job scraper to optimize server performance in production
DISABLE_SCRAPER=false

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telegram-jobs?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# NextAuth (must match client NEXTAUTH_SECRET)
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# Telegram Configuration (get from https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=

# Telegram Bot (for notifications - get from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Telegram Webhook (for production - set to your deployed URL)
TELEGRAM_WEBHOOK_URL=https://your-app.onrender.com/api/notifications/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=generate-random-32-char-string-here

# AI Provider Configuration (choose: gemini | abacus)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key

# Abacus.ai API Configuration (optional alternative)
ABACUS_API_KEY=
ABACUS_API_URL=https://routellm.abacus.ai/v1

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
TEMP_DIR=./public/temp

# LemonSqueezy Payment Integration
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=webhook_secret_from_dashboard

# Application URLs
FRONTEND_URL=http://localhost:3000
```

**Required Variables:**

- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NEXTAUTH_SECRET` - NextAuth secret (must match client)
- `GEMINI_API_KEY` or `ABACUS_API_KEY` - At least one AI provider

**Optional Variables:**

- `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING` - Only if running scraper locally
- `TELEGRAM_BOT_TOKEN` - Required for notification system
- `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET` - For production webhook mode
- `DISABLE_SCRAPER=true` - Disable scraper in production if using same Telegram session elsewhere

### Scripts

```bash
npm run dev               # Development with hot reload (nodemon)
npm run build             # Compile TypeScript to dist/ (with path aliases)
npm start                 # Production mode (runs dist/index.js)
npm run migrate           # Run migrations
npm run migrate:up        # Run migrations up
npm run migrate:down      # Run migrations down
npm run migrate:status    # Check migration status
npm run channels:seed     # Seed channels to database
npm run channels:extract  # Extract channel info from Telegram
npm test                  # Run test suite
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run lint              # Run linting check
npm run format            # Fix linting and formatting errors
```

## 🔐 Security Practices

- ✅ **JWT Authentication** - Stateless, secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Input Validation** - Joi schemas on all endpoints
- ✅ **File Type Validation** - Restrict uploads to PDF/DOCX
- ✅ **CORS Configuration** - Whitelist frontend origin
- ✅ **Environment Secrets** - Never commit `.env` files
- ✅ **Error Message Sanitization** - Hide stack traces in production

**Per-PR Checklist:**

- [ ] Input validation on new endpoints
- [ ] Secrets not hardcoded
- [ ] Dependencies scanned for vulnerabilities
- [ ] User data properly sanitized

## 🧪 Development Workflow

### Adding a New Feature

1. **Create module structure**

   ```bash
   modules/feature/
   ├── feature.controller.ts
   ├── feature.service.ts
   ├── feature.repository.ts
   ├── feature.model.ts
   ├── feature.routes.ts
   └── feature.types.ts
   ```

2. **Define types first** (`feature.types.ts`)
3. **Build repository** (data access)
4. **Implement service** (business logic)
5. **Create controller** (HTTP handling)
6. **Register routes** (`modules/index.ts`)

### Code Style

- **Concise over verbose** - Sacrifice grammar for brevity in comments
- **Explicit types** - Avoid `any`, use interfaces
- **Async/await** - No callback hell
- **Early returns** - Guard clauses over nested ifs
- **Functional patterns** - Prefer `map`/`filter` over loops

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

## 🗂️ Database Schema

### User

```typescript
{
  email: string (unique, required)
  name?: string
  image?: string
  emailVerified?: Date
  masterResumeText?: string
  masterResumeFileUrl?: string
  subscribedChannels: string[] (default: [])
  plan: 'free' | 'premium' (default: 'free')
  hasCompletedOnboarding: boolean (default: false)
  viewedJobs: string[] (default: [])

  // Subscription change tracking (abuse prevention)
  subscriptionChanges: {
    count: number (default: 0)
    lastResetDate: Date (default: now)
  }

  // Telegram Notifications
  telegramChatId?: string
  telegramSubscriptionToken?: string (unique, sparse)
  notificationEnabled: boolean (default: false)
  notificationFilters?: {
    stack: string[]
    level: string[]
    jobFunction: string[]
    locationType: string[]
    experienceYears: { min?: number, max?: number }
  }
  quietHours: {
    enabled: boolean (default: false)
    startHour: number (default: 22)
    endHour: number (default: 8)
    timezone: string (default: 'America/New_York')
  }
  lastNotificationSent?: Date
  notificationCount: number (default: 0)

  createdAt: Date
  updatedAt: Date
}
```

### Job

```typescript
{
  channelId: ObjectId
  messageId: number
  rawText: string

  parsedData: {
    jobTitle?: string
    company?: string
    techStack?: string[]
    salary?: string
    level?: 'Junior' | 'Mid' | 'Senior'
    isRemote?: boolean
    locationType?: 'Remote' | 'Hybrid' | 'Onsite'
    jobFunction?: string
    experienceYears?: { min?: number, max?: number }
    location?: string
    description?: string
  }

  // External scraping
  externalUrl?: string
  scrapedContent?: string

  createdAt: Date
  updatedAt: Date
}
```

### Channel

```typescript
{
  username: string (unique, required)
  title: string (required)
  description?: string
  category?: string
  memberCount?: string
  isActive: boolean (default: true)
  isRecommended: boolean (default: false)
  lastScrapedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Bundle

```typescript
{
  name: string (required)
  description?: string
  channels: string[] (channel usernames)
  category?: string
  isActive: boolean (default: true)
  order: number (for display sorting)
  createdAt: Date
  updatedAt: Date
}
```

### Feedback

```typescript
{
  userId?: ObjectId
  email?: string
  message: string (required)
  type?: string
  createdAt: Date
}
```

## 🎯 Roadmap

### Phase 1: Core Infrastructure ✅

- [x] Telegram integration (GramJS + Bot API)
- [x] AI job parsing (Gemini/Abacus)
- [x] Basic job feed with pagination
- [x] Resume upload and parsing
- [x] AI resume tailoring (Sniper)
- [x] User authentication (NextAuth/JWT)

### Phase 2: Advanced Features ✅

- [x] Advanced filtering (tech stack, level, location, experience years)
- [x] Channel management (subscribe/unsubscribe)
- [x] User interaction tracking (views, subscription changes)
- [x] Channel bundles for onboarding
- [x] User preferences persistence
- [x] External page scraping for job digests
- [x] Job cleanup service (auto-delete old jobs)

### Phase 3: Intelligence & Engagement ✅

- [x] Real-time Telegram notifications
- [x] Custom notification filters per user
- [x] Quiet hours with timezone support
- [x] Subscription tracking and limits (free tier: 6 swaps/month)
- [x] Platform statistics (public endpoint)
- [x] Feedback collection system

### Phase 4: Scale & Polish (In Progress)

- [x] Unit & integration tests
- [x] CI/CD Pipeline (GitHub Actions)
- [ ] Personalized job recommendations (ML-based)
- [ ] Application success tracking
- [ ] Resume A/B testing insights
- [ ] Interview preparation suggestions
- [ ] Rate limiting middleware
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Email notifications (alternative to Telegram)
- [ ] Admin dashboard
- [ ] Analytics and insights panel

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
