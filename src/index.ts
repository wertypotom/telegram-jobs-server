import 'tsconfig-paths/register';
import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import { connectDatabase } from '@config/database.config';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';
import routes from './modules';
import path from 'path';
import { promises as fs } from 'fs';
import { TelegramService } from '@modules/telegram/telegram.service';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from temp directory
app.use('/temp', express.static(path.join(__dirname, '../public/temp')));

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Create required directories
    await ensureDirectories();

    // Start Telegram listener service
    const telegramService = new TelegramService();
    await telegramService.start();

    // Start HTTP server
    app.listen(envConfig.port, () => {
      Logger.info(`Server started successfully`, {
        port: envConfig.port,
        environment: envConfig.nodeEnv,
      });
    });
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Ensure required directories exist
const ensureDirectories = async (): Promise<void> => {
  const directories = [envConfig.uploadDir, envConfig.tempDir];

  for (const dir of directories) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      Logger.info(`Created directory: ${dir}`);
    }
  }
};

startServer();
