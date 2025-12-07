import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { AIProvider, AIProviderType } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { AbacusProvider } from './abacus.provider';

/**
 * Factory to create AI provider based on environment configuration
 */
export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  /**
   * Get the configured AI provider (singleton)
   */
  static getProvider(): AIProvider {
    if (!this.instance) {
      const providerType = envConfig.aiProvider as AIProviderType;

      switch (providerType) {
        case 'gemini':
          Logger.info('Using Gemini AI provider');
          this.instance = new GeminiProvider();
          break;
        case 'abacus':
          Logger.info('Using Abacus AI provider');
          this.instance = new AbacusProvider();
          break;
        default:
          Logger.warn(
            `Unknown AI provider: ${providerType}, defaulting to Gemini`
          );
          this.instance = new GeminiProvider();
      }
    }
    return this.instance;
  }

  /**
   * Reset the provider instance (useful for testing or switching providers)
   */
  static resetProvider(): void {
    this.instance = null;
  }
}
