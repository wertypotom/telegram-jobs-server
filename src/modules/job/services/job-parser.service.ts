import { AIProvider, AIProviderFactory } from '@shared/providers';
import { ParsedJobData } from '@shared/types/common.types';
import { InternalServerError } from '@utils/errors';
import { Logger } from '@utils/logger';

export class JobParserService {
  private provider: AIProvider;

  constructor() {
    this.provider = AIProviderFactory.getProvider();
  }

  async parseJobText(rawText: string): Promise<ParsedJobData | null> {
    try {
      const prompt = this.buildParsingPrompt(rawText);
      const systemPrompt =
        'You are a job posting parser. Extract structured data from job postings and return valid JSON only.';

      const content = await this.provider.generateContent(prompt, systemPrompt);
      const parsedData = JSON.parse(content);

      // Debug: Log what AI returns
      Logger.debug('AI Parser Response', {
        hasExperienceYears: 'experienceYears' in parsedData,
        experienceYearsValue: parsedData.experienceYears,
        rawTextPreview: rawText.substring(0, 100),
      });

      // If the AI determines it's not a job posting
      if (parsedData.isJobPosting === false) {
        Logger.debug('Message is not a job posting', {
          rawText: rawText.substring(0, 100),
        });
        return null;
      }

      return {
        jobTitle: parsedData.jobTitle || undefined,
        normalizedJobTitle: parsedData.normalizedJobTitle || parsedData.jobTitle || undefined,
        company: parsedData.company || undefined,
        techStack: parsedData.techStack || [],
        salary: parsedData.salary || undefined,
        contactInfo: parsedData.contactInfo || undefined,
        isRemote: parsedData.isRemote || false,
        level: parsedData.level || undefined,
        employmentType: parsedData.employmentType || undefined,
        location: parsedData.location || undefined,
        candidateLocation: parsedData.candidateLocation || 'Anywhere',
        responsibilities: parsedData.responsibilities || [],
        requiredQualifications: parsedData.requiredQualifications || [],
        preferredQualifications: parsedData.preferredQualifications || [],
        benefits: parsedData.benefits || [],
        description: parsedData.description || undefined,
        experienceYears:
          parsedData.experienceYears !== undefined ? parsedData.experienceYears : null,
      };
    } catch (error) {
      Logger.error('Failed to parse job text:', error);
      throw new InternalServerError('Failed to parse job posting');
    }
  }

  private buildParsingPrompt(rawText: string): string {
    return `You are a job posting parser. Extract structured data from this Telegram job posting and standardize the format.

CRITICAL RULES:
1. **REMOVE ALL EMOJIS** - Do not include ANY emojis in ANY output field (✅❗️🔘💻👉 etc.)
2. **REMOVE ALL HASHTAGS** - Use hashtags to extract metadata (remote status, location) but DO NOT include them in output
3. **REMOVE FORMATTING SYMBOLS** - Remove ** (bold), __ (italic), decorative separators like "****🔘****", "=========", etc.
4. **STANDARDIZE TEXT** - Convert all-caps sections to proper case (e.g., "БУДЕТ ПРЕИМУЩЕСТВОМ" → "Будет преимуществом")
5. **EXTRACT SECTIONS** - Identify and separate different sections of the job posting

EXTRACTION GUIDELINES:

**Job Title Normalization:**
- Extract the raw job title as "jobTitle" (preserve original language)
- Translate/normalize to standard English as "normalizedJobTitle"
- Use these mappings for common Russian/Kazakh titles:
  * "Фронтенд-разработчик", "Frontend-разработчик" → "Frontend Developer"
  * "Фулстек-разработчик", "Fullstack-разработчик", "Full-stack разработчик" → "Fullstack Developer"
  * "Бэкенд-разработчик", "Backend-разработчик" → "Backend Developer"
  * "Мобильный разработчик" → "Mobile Developer"
  * "Тимлид", "Team Lead" → "Team Lead"
  * "Инженер данных", "Дата инженер" → "Data Engineer"
  * "Тестировщик", "QA Engineer" → "QA Engineer"
  * "DevOps инженер" → "DevOps Engineer"
- Match to closest standard English title from common tech roles
- If already in English, preserve as-is
- Examples:
  * "Senior Fullstack-разработчик" → "Senior Fullstack Developer"
  * "React Developer" → "React Developer"
  * "Инженер данных" → "Data Engineer"
  * "Middle Frontend разработчик" → "Middle Frontend Developer"

**Contact Information:**
- Extract Telegram usernames (format as @username)
- Extract emails
- Extract application URLs
- Extract any other contact methods

**Candidate Location:**
- Where the candidate should be based (from hashtags like #удалёнка, #remote, or text)
- If mentions "за пределами РФ/РБ" or similar restrictions, note them
- Default to "Anywhere" if not specified

**Responsibilities:**
- Look for sections like "Над чем предстоит работать", "Responsibilities", "Чем предстоит заниматься"
- Extract as clean bullet points without emojis or formatting symbols

**Required Qualifications:**
- Look for sections like "Требования", "Required", "Минимальные требования", "Что нужно"
- Extract as clean bullet points

**Preferred Qualifications:**
- Look for sections like "Будет плюсом", "Preferred", "Nice to have", "Будет преимуществом"
- Extract as clean bullet points

**Benefits:**
- Look for sections like "Мы предлагаем", "Benefits", "Почему стоит идти к нам", "Что мы предлагаем"
- Include compensation details beyond base salary
- Extract as clean bullet points

**Description:**
- Create a clean 2-3 sentence summary of the role
- Remove all emojis, hashtags, and formatting symbols
- Keep it professional and readable

**Tech Stack:**
- Extract programming languages, frameworks, tools
- Return as array of strings

**Experience Years (CRITICAL):**
- Extract REQUIRED years of experience as a NUMBER
- Look for patterns in Russian: "от X лет", "X+ лет", "Опыт X лет", "Опыт работы: от X лет", "минимум X лет"
- Look for patterns in English: "X+ years", "X years of experience", "minimum X years"
- Extract the MINIMUM required number (e.g., "от 3 лет" = 3, "5+ years" = 5)
- If a range is given (e.g., "3-5 лет"), use the minimum (3)
- If only mentioned in qualifications like "Опыт коммерческой разработки от 3 лет", extract 3
- Return as a number, or null/undefined if not specified
- Examples: 
  * "Опыт работы: от 3 лет" → 3
  * "5+ years experience" → 5
  * "Опыт коммерческой разработки от 2 лет" → 2
  * "Junior developer" (no explicit years) → null

**Validation:**
- If this is NOT a job posting (resume, spam, discussion), set "isJobPosting" to false
- If it contains hashtags like #резюме, #ищуработу, #lookingforjob, set "isJobPosting" to false

Return a JSON object with this EXACT structure:
{
  "isJobPosting": boolean,
  "jobTitle": string or null,
  "normalizedJobTitle": string or null,
  "company": string or null,
  "techStack": array of strings,
  "salary": string or null,
  "contactInfo": {
    "telegram": string or null (e.g., "@username"),
    "email": string or null,
    "applicationUrl": string or null,
    "other": string or null
  },
  "isRemote": boolean,
  "level": string or null (e.g., "Junior", "Middle", "Senior", "Lead"),
  "employmentType": string or null (e.g., "Full-time", "Contract", "Part-time"),
  "location": string or null (company location),
  "candidateLocation": string (where candidate should be based, default "Anywhere"),
  "responsibilities": array of strings (clean bullet points, no emojis),
  "requiredQualifications": array of strings (clean bullet points, no emojis),
  "preferredQualifications": array of strings (clean bullet points, no emojis),
  "benefits": array of strings (clean bullet points, no emojis),
  "description": string (clean 2-3 sentence summary, no emojis/hashtags),
  "experienceYears": number or null (minimum required years of experience)
}

Job posting text:
${rawText}`;
  }
}
