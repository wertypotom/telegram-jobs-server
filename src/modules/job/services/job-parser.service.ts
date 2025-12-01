import axios from 'axios';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { ParsedJobData } from '@shared/types/common.types';
import { InternalServerError } from '@utils/errors';

export class JobParserService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = envConfig.abacusApiKey;
    this.apiUrl = envConfig.abacusApiUrl;
  }

  async parseJobText(rawText: string): Promise<ParsedJobData | null> {
    try {
      const prompt = this.buildParsingPrompt(rawText);

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a job posting parser. Extract structured data from job postings and return valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const parsedData = JSON.parse(content);

      // If the AI determines it's not a job posting
      if (parsedData.isJobPosting === false) {
        Logger.debug('Message is not a job posting', { rawText: rawText.substring(0, 100) });
        return null;
      }

      return {
        jobTitle: parsedData.jobTitle || undefined,
        company: parsedData.company || undefined,
        techStack: parsedData.techStack || [],
        salary: parsedData.salary || undefined,
        contactMethod: parsedData.contactMethod || undefined,
        isRemote: parsedData.isRemote || false,
        level: parsedData.level || undefined,
      };
    } catch (error) {
      Logger.error('Failed to parse job text with AI:', error);
      throw new InternalServerError('Failed to parse job posting');
    }
  }

  private buildParsingPrompt(rawText: string): string {
    return `Extract the following information from this job posting. If it's not a job posting, set "isJobPosting" to false.

Return a JSON object with this structure:
{
  "isJobPosting": boolean,
  "jobTitle": string or null,
  "company": string or null,
  "techStack": array of strings (e.g., ["React", "Node.js", "TypeScript"]),
  "salary": string or null (e.g., "$80k-$120k", "3000-5000 USD"),
  "contactMethod": string or null (Telegram username, email, or other contact),
  "isRemote": boolean,
  "level": string or null (e.g., "junior", "middle", "senior")
}

Job posting text:
${rawText}`;
  }
}
