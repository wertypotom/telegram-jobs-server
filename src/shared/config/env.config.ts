export const envConfig = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongodbUri: process.env.MONGODB_URI || '',

  // JWT
  jwtSecret: String(process.env.JWT_SECRET || 'default-secret-change-in-production'),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string | number,

  // Telegram
  telegramApiId: process.env.TELEGRAM_API_ID || '',
  telegramApiHash: process.env.TELEGRAM_API_HASH || '',
  telegramSessionString: process.env.TELEGRAM_SESSION_STRING || '',

  // Abacus.ai API
  abacusApiKey: process.env.ABACUS_API_KEY || '',
  abacusApiUrl: process.env.ABACUS_API_URL || 'https://api.abacus.ai/v1',

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  tempDir: process.env.TEMP_DIR || './public/temp',

  // Application
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
