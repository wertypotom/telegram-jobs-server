import axios from 'axios';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { AIProvider } from './ai-provider.interface';

/**
 * Abacus AI Provider (OpenAI-compatible API)
 */
export class AbacusProvider implements AIProvider {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = envConfig.abacusApiKey;
    this.apiUrl = envConfig.abacusApiUrl;
  }

  async generateContent(prompt: string, systemPrompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from Abacus');
      }

      Logger.debug('Abacus response received', {
        responseLength: content.length,
      });

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Logger.error('Abacus API error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        Logger.error('Abacus API error:', error);
      }
      throw error;
    }
  }
}
