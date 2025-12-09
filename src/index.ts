import 'tsconfig-paths/register';
import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
app.use(
  cors({
    origin: envConfig.frontendUrl,
    credentials: true, // Important: Allow cookies
  })
);
app.use(cookieParser()); // Parse cookies
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

    // Seed default channels
    const { seedChannels } = await import('@modules/channel/channel.seed');
    const { cleanupInvalidChannels } = await import(
      '@modules/channel/channel.cleanup'
    );
    await cleanupInvalidChannels();
    await seedChannels();

    // Seed bundles
    const { seedBundles } = await import('@modules/bundle/bundle.seed');
    await seedBundles();

    // Start Telegram listener service
    const telegramService = new TelegramService();
    await telegramService.start();

    // Initialize Telegram notification bot
    const { TelegramBotService } = await import(
      '@modules/notification/telegram-bot.service'
    );
    TelegramBotService.getInstance(); // Initialize bot singleton
    Logger.info('Telegram notification bot initialized');

    // Start background scraper
    const { ScraperService } = await import('@modules/scraper/scraper.service');
    const scraperService = new ScraperService();
    // Don't await scraper start to avoid blocking server startup
    scraperService.start().catch((err) => {
      Logger.error('Failed to start scraper:', err);
    });

    // Start job cleanup service
    const { JobCleanupService } = await import(
      '@modules/job/job-cleanup.service'
    );
    const cleanupService = new JobCleanupService();
    cleanupService.start();
    Logger.info('Job cleanup service started (runs every 7 days)');

    // Start HTTP server
    const server = app.listen(envConfig.port, () => {
      Logger.info(`Server started successfully`, {
        port: envConfig.port,
        environment: envConfig.nodeEnv,
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      Logger.info('Shutting down server...');

      scraperService.stop();
      await telegramService.stop();

      server.close(() => {
        Logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
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
