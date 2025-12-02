# Telegram Job Scraper Backend

A Node.js/Express backend application that monitors Telegram channels for job postings, parses them using AI (Abacus.ai), and generates tailored resumes for users.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📱 **Telegram Integration** - Monitors job channels automatically using GramJS
- 🤖 **AI-Powered Job Parsing** - Extracts structured data from unstructured job posts
- 📄 **Resume Management** - Upload and store master resumes (PDF/DOCX)
- ✨ **AI Resume Tailoring** - Generates customized resumes for specific jobs
- 📊 **Job Feed API** - Filter jobs by tech stack, level, remote status
- 📝 **Multi-Format Export** - Generate tailored resumes in PDF and DOCX

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Telegram**: GramJS
- **AI**: Abacus.ai API
- **Authentication**: JWT + bcrypt
- **File Processing**: multer, pdf-parse, mammoth, pdfkit, docx

## Project Structure

```
src/
├── index.ts                    # Application entry point
├── modules/                    # Feature modules
│   ├── auth/                  # Authentication (register, login)
│   ├── user/                  # User management
│   ├── job/                   # Job feed and parsing
│   ├── resume/                # Resume upload and processing
│   ├── sniper/                # Resume tailoring engine
│   └── telegram/              # Telegram listener service
└── shared/                    # Shared utilities
    ├── config/                # Environment and database config
    ├── middlewares/           # Express middlewares
    ├── utils/                 # Logger, errors, response formatter
    └── types/                 # Shared TypeScript types
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Abacus.ai API key
- (Optional) Telegram account for listener

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Required Configuration:**

```env
# MongoDB Atlas - Get connection string from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telegram-jobs

# JWT Secret - Generate a secure random string
JWT_SECRET=your-super-secret-jwt-key-change-this

# Abacus.ai API - Get from Abacus.ai dashboard
ABACUS_API_KEY=your_abacus_api_key
ABACUS_API_URL=https://api.abacus.ai/v1
```

**Optional (for Telegram listener):**

```env
# Get from https://my.telegram.org
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
```

> **Note**: The app will run without Telegram credentials, but won't listen to channels. You can add them later.

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Jobs

- `GET /api/jobs` - Get job feed with filters
  - Query params: `stack`, `level`, `isRemote`, `limit`, `offset`
- `GET /api/jobs/:id` - Get specific job details

### Resume

- `POST /api/resume/upload` - Upload master resume (PDF/DOCX)
  - Requires authentication
  - Form data: `resume` file

### Sniper (Resume Tailoring)

- `POST /api/sniper/generate` - Generate tailored resume
  - Requires authentication
  - Body: `{ "jobId": "job_id_here" }`
  - Returns: PDF/DOCX URLs, Telegram message, cover letter

## Usage Flow

1. **Register/Login**

   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```

2. **Upload Master Resume**

   ```bash
   curl -X POST http://localhost:3000/api/resume/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "resume=@path/to/resume.pdf"
   ```

3. **Browse Jobs**

   ```bash
   curl http://localhost:3000/api/jobs?stack=react&limit=10
   ```

4. **Generate Tailored Resume**
   ```bash
   curl -X POST http://localhost:3000/api/sniper/generate \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"jobId":"JOB_ID_FROM_FEED"}'
   ```

## Telegram Setup (Optional)

### Getting Telegram Credentials

1. Go to https://my.telegram.org
2. Login with your phone number
3. Go to "API development tools"
4. Create a new application
5. Copy `api_id` and `api_hash` to `.env`

### First Run

On first run with Telegram credentials, the app will:

- Connect to Telegram
- Join default CIS IT job channels
- Start listening for new job posts
- Save session for future runs

### Default Channels

The app monitors these channels by default:

- @job_for_juniors
- @javascript_jobs
- @nodejs_jobs

## How It Works

1. **Telegram Listener** monitors configured channels for new messages
2. **Job Parser** uses Abacus.ai to extract structured data from messages
3. **Job Feed** provides filtered access to parsed jobs
4. **Resume Tailoring** uses AI to customize resumes for specific jobs
5. **File Generation** creates professional PDF and DOCX documents

## Development

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Production
npm start
```

## Architecture

The application follows a **3-layer architecture**:

```
Controller → Service → Repository
```

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and orchestration
- **Repositories**: Database operations

## Error Handling

- Custom error classes for different HTTP status codes
- Global error middleware
- Standardized API responses
- Environment-aware error details

## Logging

- Timestamp-based logging
- Different log levels (info, error, warn, debug)
- Debug logs only in development mode

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Request validation with Joi
- File type validation for uploads
- CORS enabled

## Future Enhancements

- [ ] Add tests (unit and integration)
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger)
- [ ] Email notifications for new jobs
- [ ] User preferences for job filtering
- [ ] Resume templates
- [ ] Analytics dashboard

## License

MIT

## Author

werty.potom
