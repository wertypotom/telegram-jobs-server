/**
 * AI Provider Interface
 * Allows switching between different AI providers (Gemini, Abacus, etc.)
 */
export interface AIProvider {
  /**
   * Generate content from a prompt
   * @param prompt - The user prompt
   * @param systemPrompt - The system instructions
   * @returns The generated text response
   */
  generateContent(prompt: string, systemPrompt: string): Promise<string>;
}

export type AIProviderType = 'gemini' | 'abacus';
