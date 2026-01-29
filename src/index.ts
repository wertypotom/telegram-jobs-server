import 'tsconfig-paths/register';
import 'dotenv/config';

import { connectDatabase } from '@config/database.config';
import { envConfig } from '@config/env.config';
// CRITICAL: Initialize Sentry before any other imports
import { initSentry } from '@config/sentry.config';
import { TelegramService } from '@modules/telegram/telegram.service';
import { JobQueueService } from '@shared/queue/job-queue.service';
import * as Sentry from '@sentry/node';
import { Logger } from '@utils/logger';
import { promises as fs } from 'fs';

import app from './app';

initSentry();

// Initialize server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Create required directories
    await ensureDirectories();

    // Seed default channels
    const { seedChannels } = await import('@modules/channel/channel.seed');
    const { cleanupInvalidChannels } = await import('@modules/channel/channel.cleanup');
    await cleanupInvalidChannels();
    await seedChannels();

    // Seed bundles
    const { seedBundles } = await import('@modules/bundle/bundle.seed');
    await seedBundles();

    // Initialize Telegram notification bot (always runs - uses TELEGRAM_BOT_TOKEN)
    const { TelegramBotService } = await import('@modules/notification/telegram-bot.service');
    TelegramBotService.getInstance();
    Logger.info('Telegram notification bot initialized');

    // Start Telegram scraper services (optional - can disable in production)
    let telegramService: TelegramService | null = null;
    let scraperService: any = null;
    if (!envConfig.disableScraper) {
      // Telegram listener (uses TELEGRAM_SESSION_STRING)
      telegramService = new TelegramService();
      await telegramService.start();

      const { ScraperService } = await import('@modules/scraper/scraper.service');
      scraperService = new ScraperService();
      scraperService.start().catch((err: any) => {
        Logger.error('Failed to start scraper:', err);
      });
      Logger.info('Telegram scraper & listener enabled');
    } else {
      Logger.info('Telegram scraper disabled (DISABLE_SCRAPER=true)');
    }

    // Initialize job queue worker
    let jobQueueService: JobQueueService | null = null;
    if (envConfig.enableJobQueue) {
      try {
        jobQueueService = JobQueueService.getInstance();
        jobQueueService.startWorker();
        Logger.info('Job queue worker started');
      } catch (error) {
        Logger.error('Queue init failed, falling back to sync:', error);
        Sentry.captureException(error, {
          tags: { errorType: 'queue_init_failure' },
        });
      }
    } else {
      Logger.info('Job queue disabled (ENABLE_JOB_QUEUE=false)');
    }

    // Start job cleanup service
    const { JobCleanupService } = await import('@modules/job/job-cleanup.service');
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

      // Stop queue worker first
      if (jobQueueService) {
        try {
          await jobQueueService.stopWorker();
          Logger.info('Queue worker stopped');
        } catch (error) {
          Logger.error('Error stopping queue worker:', error);
        }
      }

      if (scraperService) {
        scraperService.stop();
      }
      if (telegramService) {
        await telegramService.stop();
      }

      // Close server
      server.close(() => {
        Logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        Logger.warn('Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    // Global error handlers (CRITICAL: prevent crashes)
    process.on('unhandledRejection', (reason) => {
      Logger.error('Unhandled Promise Rejection:', reason);
      Sentry.captureException(reason);
      // Don't crash the server - just log
    });

    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception:', error);
      Sentry.captureException(error);
      // In production, log but continue
      if (envConfig.nodeEnv !== 'production') {
        process.exit(1);
      }
    });

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
