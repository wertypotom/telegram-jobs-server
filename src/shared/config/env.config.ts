export const envConfig = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  disableScraper: process.env.DISABLE_SCRAPER === 'true',

  // Database
  mongodbUri: process.env.MONGODB_URI || '',

  // JWT
  jwtSecret: String(process.env.JWT_SECRET || 'default-secret-change-in-production'),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string | number,

  // Telegram
  telegramApiId: process.env.TELEGRAM_API_ID || '',
  telegramApiHash: process.env.TELEGRAM_API_HASH || '',
  telegramSessionString: process.env.TELEGRAM_SESSION_STRING || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '', // Optional for now || '',
  telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',

  // Abacus.ai API
  abacusApiKey: process.env.ABACUS_API_KEY || '',
  abacusApiUrl: process.env.ABACUS_API_URL || 'https://api.abacus.ai/v1',

  // AI Provider Configuration
  aiProvider: process.env.AI_PROVIDER || 'gemini', // 'gemini' | 'abacus'
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  tempDir: process.env.TEMP_DIR || './public/temp',

  // Application
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // LemonSqueezy Payment
  lemonsqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY || '',
  lemonsqueezyStoreId: process.env.LEMONSQUEEZY_STORE_ID || '',
  lemonsqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
  lemonsqueezyPremiumVariantId: process.env.LEMONSQUEEZY_PREMIUM_VARIANT_ID || '',
};
