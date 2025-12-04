# Telegram Job Scraper Backend

**AI-powered job aggregation platform** that monitors Telegram channels, parses job postings with AI, and generates tailored resumes for each opportunity.

## 🎯 What I'm Building

A comprehensive job discovery and application automation system that:

- **Aggregates** job postings from multiple Telegram channels in real-time
- **Parses** unstructured job posts into structured data using AI (Abacus.ai)
- **Filters** jobs by tech stack, experience level, location type, and custom criteria
- **Tailors** resumes automatically for each job using AI
- **Generates** professional PDF/DOCX resumes optimized for specific positions
- **Tracks** user interactions (views, likes, applications) for personalized recommendations

This is a **full-stack backend service** designed to eliminate manual job hunting and resume customization, allowing developers to focus on interview preparation rather than application logistics.

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
│   ├── job/                   # Job feed & filtering
│   │   ├── job.controller.ts  # Advanced filter handling
│   │   ├── job.service.ts     # Business logic + AI parsing
│   │   ├── job.repository.ts  # Complex MongoDB queries
│   │   ├── job.model.ts       # Mongoose schema
│   │   ├── job.routes.ts
│   │   └── job.types.ts       # Filter options, DTOs
│   ├── resume/                # Resume upload & parsing
│   ├── sniper/                # AI resume tailoring
│   │   ├── sniper.service.ts  # Orchestration
│   │   └── services/          # Specialized sub-services
│   │       ├── ai-tailor.service.ts    # Abacus.ai integration
│   │       ├── pdf-generator.service.ts
│   │       └── docx-generator.service.ts
│   ├── scraper/               # Background job scraper
│   ├── telegram/              # GramJS listener service
│   └── user/                  # User management & auth
└── shared/                    # Cross-cutting concerns
    ├── config/                # Environment & database
    │   ├── env.config.ts      # Centralized env vars
    │   └── database.config.ts # MongoDB connection
    ├── middlewares/           # Express middleware
    │   ├── auth.middleware.ts # JWT verification
    │   ├── error.middleware.ts # Global error handler
    │   └── validation.middleware.ts # Joi schemas
    ├── utils/                 # Utilities
    │   ├── logger.ts          # Structured logging
    │   ├── errors.ts          # Custom error classes
    │   └── response.ts        # Standardized API responses
    └── types/                 # Shared TypeScript types
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

#### 2. **AI Job Parsing**

- Extracts structured data from unstructured Telegram messages:
  - Job title, company, salary
  - Tech stack (array of technologies)
  - Experience level (Junior/Mid/Senior)
  - Location type (Remote/Hybrid/Onsite)
  - Job function (Frontend/Backend/Full Stack/etc.)
- Powered by Abacus.ai LLM API

#### 3. **Advanced Job Filtering**

- **Tech Stack**: Multi-select with autocomplete
- **Experience Level**: Junior/Mid/Senior
- **Location Type**: Remote/Hybrid/Onsite
- **Job Function**: Frontend/Backend/Full Stack/DevOps/etc.
- **Excluded Titles**: Blacklist specific roles
- **Mute Keywords**: Filter out unwanted terms
- Pagination support (limit/offset)

#### 4. **Resume Management**

- Upload master resume (PDF/DOCX)
- Automatic text extraction
- Storage in MongoDB + file system

#### 5. **AI Resume Tailoring**

- Analyzes job requirements vs. master resume
- Generates customized:
  - Resume summary
  - Skills section
  - Cover letter
  - Telegram application message
- Exports to PDF and DOCX

#### 6. **User Interaction Tracking**

- Mark jobs as viewed
- Like/unlike jobs
- Track applications
- Personalized recommendations (future)

## 📡 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Channels

```http
GET  /api/channels              # List all channels
GET  /api/channels/recommended  # Get recommended channels
POST /api/channels/subscribe    # Subscribe to channel
POST /api/channels/unsubscribe  # Unsubscribe from channel
```

### Jobs

```http
GET  /api/jobs                  # Get filtered job feed
GET  /api/jobs/:id              # Get job details
POST /api/jobs/:id/view         # Mark job as viewed
GET  /api/jobs/skills/search    # Autocomplete tech skills
```

**Example Filter Query:**

```bash
GET /api/jobs?stack=react&stack=typescript&level=Mid&locationType=Remote&limit=20&offset=0
```

### Resume

```http
POST /api/resume/upload         # Upload master resume (multipart/form-data)
```

### Sniper (Resume Tailoring)

```http
POST /api/sniper/generate       # Generate tailored resume for job
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
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/telegram-jobs

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET=your-nextauth-secret

# Telegram (optional for scraping)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# AI
ABACUS_API_KEY=your_abacus_key
ABACUS_API_URL=https://routellm.abacus.ai/v1

# File Uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
TEMP_DIR=./public/temp

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Scripts

```bash
npm run dev      # Development with hot reload (nodemon)
npm run build    # Compile TypeScript to dist/
npm start        # Production mode (runs dist/index.js)
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
  email: string (unique)
  password: string (hashed)
  masterResumeText?: string
  masterResumeUrl?: string
  createdAt: Date
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
  }
  createdAt: Date
}
```

### Channel

```typescript
{
  username: string (unique)
  title: string
  description?: string
  category?: string
  memberCount?: string
  isActive: boolean
  lastScrapedAt?: Date
}
```

## 🎯 Roadmap

### Phase 1: Core Infrastructure ✅

- [x] Telegram integration
- [x] AI job parsing
- [x] Basic job feed
- [x] Resume upload
- [x] AI resume tailoring

### Phase 2: Advanced Features (In Progress)

- [x] Advanced filtering (tech stack, level, location)
- [x] Channel management
- [x] User interaction tracking
- [ ] Bundle onboarding for new users
- [ ] Explore modal with search

### Phase 3: Intelligence

- [ ] Personalized job recommendations
- [ ] Application success tracking
- [ ] Resume A/B testing
- [ ] Interview preparation suggestions

### Phase 4: Scale & Polish

- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Unit & integration tests
- [ ] Email notifications
- [ ] Analytics dashboard

## 📝 License

MIT

## 👤 Author

**werty.potom**

---

**Built with a focus on pragmatism, type safety, and developer experience.**
