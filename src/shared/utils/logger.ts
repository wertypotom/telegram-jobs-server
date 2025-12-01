import { envConfig } from '@config/env.config';

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

  static error(message: string, error?: any): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage('ERROR', message, errorDetails));
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
