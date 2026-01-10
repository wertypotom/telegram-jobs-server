import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { envConfig } from './env.config';

/**
 * Initialize Sentry for error monitoring and performance tracking
 * Must be imported before any other modules in index.ts
 */
export function initSentry(): void {
  // Skip initialization if DSN is not configured
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || envConfig.nodeEnv,

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),

    // Profiling (production only)
    profilesSampleRate: envConfig.nodeEnv === 'production' ? 0.1 : 0,

    integrations: [
      // Enable profiling
      nodeProfilingIntegration(),
    ],

    // Release tracking (optional)
    release: process.env.npm_package_version,

    // Additional context
    beforeSend(event) {
      // Don't send events in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      return event;
    },
  });
}
