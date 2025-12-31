import { envConfig } from '@config/env.config';
import { GoogleGenAI } from '@google/genai';
import { Logger } from '@utils/logger';

import { AIProvider } from './ai-provider.interface';

/**
 * Google Gemini AI Provider
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: envConfig.geminiApiKey });
    this.model = 'gemini-3-pro-preview'; // Latest Gemini model
  }

  async generateContent(
    prompt: string,
    systemPrompt: string,
    jsonMode: boolean = true
  ): Promise<string> {
    try {
      const config: any = {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      };

      // Only set JSON mime type if jsonMode is enabled
      if (jsonMode) {
        config.responseMimeType = 'application/json';
      }

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config,
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      Logger.debug('Gemini response received', {
        model: this.model,
        responseLength: text.length,
      });

      return text;
    } catch (error) {
      Logger.error('Gemini API error:', error);
      throw error;
    }
  }
}
