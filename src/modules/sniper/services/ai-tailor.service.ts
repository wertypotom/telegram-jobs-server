import { envConfig } from '@config/env.config';
import { InternalServerError } from '@utils/errors';
import { Logger } from '@utils/logger';
import axios from 'axios';

import { TailoredContent } from '../sniper.types';

export class AiTailorService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = envConfig.abacusApiKey;
    this.apiUrl = envConfig.abacusApiUrl;
  }

  async tailorResume(masterResume: string, jobDescription: string): Promise<TailoredContent> {
    try {
      const prompt = this.buildTailoringPrompt(masterResume, jobDescription);

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional resume writer and career coach. Tailor resumes to match job descriptions while keeping information truthful.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
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
      const tailoredData = JSON.parse(content);

      return {
        summary: tailoredData.summary || '',
        skills: tailoredData.skills || [],
        telegramMessage: tailoredData.telegramMessage || '',
        coverLetter: tailoredData.coverLetter || '',
      };
    } catch (error) {
      Logger.error('Failed to tailor resume with AI:', error);
      throw new InternalServerError('Failed to tailor resume');
    }
  }

  private buildTailoringPrompt(masterResume: string, jobDescription: string): string {
    return `I need you to tailor a resume for a specific job posting. 

Master Resume:
${masterResume}

Job Description:
${jobDescription}

Please provide a JSON response with:
{
  "summary": "A rewritten professional summary that highlights relevant skills and experience for this job",
  "skills": ["Array of key skills to emphasize, matching the job requirements"],
  "telegramMessage": "A short, professional message (2-3 sentences) to send to the recruiter via Telegram",
  "coverLetter": "A brief cover letter (3-4 paragraphs) explaining why the candidate is a great fit"
}

Keep all information truthful. Focus on highlighting relevant experience and skills from the master resume that match the job requirements.`;
  }
}
