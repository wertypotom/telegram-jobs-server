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

  async generateContent(
    prompt: string,
    systemPrompt: string,
    jsonMode: boolean = true
  ): Promise<string> {
    try {
      const requestBody: any = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      };

      // Only add response_format for JSON mode
      if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        requestBody,
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
          requestUrl: `${this.apiUrl}/chat/completions`,
          requestModel: 'gpt-4o-mini',
          promptLength: prompt.length,
          systemPromptLength: systemPrompt.length,
          headers: error.response?.headers,
        });
      } else {
        Logger.error('Abacus API error:', error);
      }
      throw error;
    }
  }
}
