import { envConfig } from '@config/env.config';
import * as Sentry from '@sentry/node';

export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(level: string, message: string, metadata?: any): string {
    const timestamp = this.formatTimestamp();
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  static info(message: string, metadata?: any): void {
    console.log(this.formatMessage('INFO', message, metadata));
  }

  /**
   * Log error and automatically capture in Sentry (production only)
   * @param message - Error message
   * @param error - Error object or metadata
   * @param options - Optional Sentry context (tags, extra data)
   */
  static error(
    message: string,
    error?: any,
    options?: { tags?: Record<string, string>; extra?: Record<string, any> }
  ): void {
    const errorDetails =
      error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.formatMessage('ERROR', message, errorDetails));

    // Automatically capture in Sentry (production only)
    if (envConfig.nodeEnv === 'production' && error) {
      const errorToCapture = error instanceof Error ? error : new Error(message);

      Sentry.captureException(errorToCapture, {
        tags: options?.tags,
        extra: {
          ...options?.extra,
          logMessage: message,
          errorDetails,
        },
      });
    }
  }

  static warn(message: string, metadata?: any): void {
    console.warn(this.formatMessage('WARN', message, metadata));
  }

  static debug(message: string, metadata?: any): void {
    if (envConfig.nodeEnv === 'development') {
      console.debug(this.formatMessage('DEBUG', message, metadata));
    }
  }
}
