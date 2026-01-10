// CRITICAL: Load .env FIRST before any other imports that read process.env
import { envConfig } from '@config/env.config';
import { AIProviderFactory } from '@shared/providers/ai-provider.factory';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import path from 'path';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Extract Telegram Channel Information Script
 *
 * Usage:
 * 1. Add channel usernames to the CHANNELS_TO_EXTRACT array
 * 2. Run: npm run channels:extract
 * 3. Copy the output and add to channel.seed.ts
 */

// Add your channel usernames here (with or without @)
const CHANNELS_TO_EXTRACT = ['@vacancy_it_ulbitv'];

interface ChannelInfo {
  username: string;
  title: string;
  description: string;
  category: string;
  memberCount: string;
}

/**
 * Format member count to readable string (e.g., 1234 -> "1.2K+")
 */
function formatMemberCount(count: number | undefined): string {
  if (!count || count === 0) {
    return 'N/A';
  }
  if (count >= 1000000) {
    return `${Math.floor(count / 100000) / 10}M+`;
  }
  if (count >= 1000) {
    return `${Math.floor(count / 100) / 10}K+`;
  }
  return `${count}+`;
}

/**
 * Use AI to create a concise, professional description matching the app's format
 */
async function summarizeDescription(title: string, rawDescription: string): Promise<string> {
  try {
    const aiProvider = AIProviderFactory.getProvider();

    const systemPrompt = `You are a professional editor creating concise channel descriptions for a job board app.

TASK: Transform the raw channel description into a SHORT, professional summary (max 60 characters).

RULES:
- Focus on what the channel offers (e.g., "Python developer positions", "Remote tech jobs")
- Remove promotional text, admin contacts, links, registration numbers
- Keep it simple and descriptive
- Use the language that best fits the content (English or Russian)
- NO emojis, NO special formatting

EXAMPLES OF GOOD DESCRIPTIONS:
- "Frontend development positions"
- "React and JavaScript developer jobs"
- "Вакансии для Python-разработчиков"
- "Remote technology positions"
- "DevOps engineer positions"

Return ONLY the description text, nothing else.`;

    const prompt = `Channel Title: ${title}
Raw Description: ${rawDescription}

Create a concise description:`;

    const response = await aiProvider.generateContent(prompt, systemPrompt, false); // Plain text mode
    const summary = response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present

    // Fallback if AI response is too long or empty
    if (!summary || summary.length > 80) {
      return fallbackSummarizeDescription(rawDescription);
    }

    return summary;
  } catch (error) {
    Logger.warn('AI summarization failed, using fallback', error);
    return fallbackSummarizeDescription(rawDescription);
  }
}

/**
 * Fallback description summarization (simple truncation)
 */
function fallbackSummarizeDescription(description: string, maxLength: number = 60): string {
  // Remove URLs, mentions, and extra whitespace
  const clean = description
    .replace(/https?:\/\/\S+/g, '') // Remove URLs
    .replace(/@\w+/g, '') // Remove mentions
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  // Try to cut at a word boundary
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated.trim() + '...';
}

/**
 * Use AI to suggest the most appropriate category
 */
async function suggestCategoryWithAI(title: string, description: string): Promise<string> {
  try {
    const aiProvider = AIProviderFactory.getProvider();

    const systemPrompt = `You are a job categorization expert. Analyze the channel title and description to determine the most appropriate category.

Available categories:
- General IT: General tech jobs, junior positions, remote work
- Frontend: React, Vue, Angular, JavaScript, TypeScript, Web development
- Backend: Node.js, Python, Java, Go, PHP, Ruby, Rust, C++, Django, Spring, Laravel
- Mobile: iOS, Android, React Native, Flutter, Swift, Kotlin
- DevOps: Kubernetes, Docker, AWS, Azure, Cloud, Infrastructure
- Data Science: ML, AI, Data Analytics, Big Data, Data Engineering
- QA: Testing, Quality Assurance, Automation
- GameDev: Unity, Unreal, Game Development
- InfoSec: Cybersecurity, Security, Penetration Testing
- Blockchain: Crypto, Web3, Ethereum, DeFi, Smart Contracts
- Database: MongoDB, PostgreSQL, MySQL, Database Administration

Return ONLY the category name, nothing else.`;

    const prompt = `Channel Title: ${title}
Channel Description: ${description}

What is the most appropriate category?`;

    const response = await aiProvider.generateContent(prompt, systemPrompt, false); // Plain text mode
    const category = response.trim().replace(/["']/g, '');

    // Validate it's a known category
    const validCategories = [
      'General IT',
      'Frontend',
      'Backend',
      'Mobile',
      'DevOps',
      'Data Science',
      'QA',
      'GameDev',
      'InfoSec',
      'Blockchain',
      'Database',
    ];

    if (validCategories.includes(category)) {
      return category;
    }

    // Fallback to keyword matching
    return suggestCategoryKeywords(title, description);
  } catch (error) {
    Logger.warn('AI categorization failed, using keyword matching', error);
    return suggestCategoryKeywords(title, description);
  }
}

/**
 * Suggest category based on keywords (fallback method)
 * Prioritizes title over description
 */
function suggestCategoryKeywords(title: string, description: string): string {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  // Category mapping with keywords
  const categories = {
    DevOps: ['devops', 'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'cloud', 'infrastructure'],
    Backend: [
      'backend',
      'nodejs',
      'node.js',
      'python',
      'java',
      'golang',
      'php',
      'ruby',
      'rust',
      'c++',
      'scala',
      'elixir',
      'django',
      'spring',
      'laravel',
      'nestjs',
    ],
    Frontend: [
      'frontend',
      'react',
      'vue',
      'angular',
      'javascript',
      'typescript',
      'nextjs',
      'next.js',
      'web dev',
      'webdev',
    ],
    Mobile: ['ios', 'android', 'mobile', 'swift', 'kotlin', 'react native', 'flutter', 'xamarin'],
    'Data Science': [
      'data science',
      'machine learning',
      'ml',
      'ai',
      'artificial intelligence',
      'data analyst',
      'big data',
      'data engineer',
      'nlp',
    ],
    Blockchain: ['blockchain', 'crypto', 'ethereum', 'defi', 'web3', 'solidity', 'smart contract'],
    QA: ['qa', 'quality assurance', 'testing', 'test automation', 'тестирование'],
    GameDev: ['gamedev', 'game dev', 'unity', 'unreal', 'game development'],
    InfoSec: ['security', 'cybersecurity', 'infosec', 'pentesting', 'безопасность'],
    Database: ['database', 'mongodb', 'postgresql', 'mysql', 'sql', 'dba'],
    'General IT': ['junior', 'it jobs', 'developer', 'tech jobs', 'remote', 'вакансии'],
  };

  // First check title (higher priority)
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => titleLower.includes(keyword))) {
      return category;
    }
  }

  // Then check description
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => descLower.includes(keyword))) {
      return category;
    }
  }

  return 'General IT'; // Default category
}

/**
 * Normalize username to always include @
 */
function normalizeUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`;
}

/**
 * Extract channel information
 */
async function extractChannelInfo() {
  let client: TelegramClient | null = null;

  try {
    // Initialize Telegram client
    const session = new StringSession(envConfig.telegramSessionString || '');
    client = new TelegramClient(
      session,
      parseInt(envConfig.telegramApiId),
      envConfig.telegramApiHash,
      { connectionRetries: 5 }
    );

    await client.connect();
    Logger.info('✅ Connected to Telegram');

    if (CHANNELS_TO_EXTRACT.length === 0) {
      Logger.warn(
        '⚠️  No channels to extract. Add channel usernames to CHANNELS_TO_EXTRACT array.'
      );
      return;
    }

    const channelInfos: ChannelInfo[] = [];

    Logger.info(`\n📊 Extracting info for ${CHANNELS_TO_EXTRACT.length} channels...\n`);

    for (const username of CHANNELS_TO_EXTRACT) {
      try {
        const normalizedUsername = normalizeUsername(username.trim());
        Logger.info(`Fetching: ${normalizedUsername}`);

        // Get channel entity
        const entity = await client.getEntity(normalizedUsername);

        // Get full channel info
        const fullChannel = await client.invoke(
          new Api.channels.GetFullChannel({
            channel: entity,
          })
        );

        // Extract channel details
        const channel = fullChannel.chats[0] as Api.Channel;
        const fullChannelInfo = fullChannel.fullChat as Api.ChannelFull;

        const title = channel.title || 'Unknown';
        const rawDescription = fullChannelInfo.about || 'No description';

        // Use AI to create concise description
        Logger.info(`  Creating description...`);
        const description = await summarizeDescription(title, rawDescription);

        // Try multiple fields for member count
        const memberCount =
          (fullChannelInfo as any).participantsCount ||
          channel.participantsCount ||
          (channel as any).count ||
          undefined;

        // Use AI for category suggestion
        Logger.info(`  Analyzing category...`);
        const suggestedCategory = await suggestCategoryWithAI(title, rawDescription);

        const info: ChannelInfo = {
          username: normalizedUsername,
          title,
          description,
          category: suggestedCategory,
          memberCount: formatMemberCount(memberCount),
        };

        channelInfos.push(info);
        Logger.info(
          `  ✓ ${title} - ${formatMemberCount(memberCount)} members (${suggestedCategory})`
        );

        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error: any) {
        Logger.error(`  ✗ Failed to fetch ${username}:`, error.message);
      }
    }

    // Output results
    Logger.info('\n' + '='.repeat(80));
    Logger.info('📋 EXTRACTED CHANNEL INFORMATION');
    Logger.info('='.repeat(80) + '\n');
    Logger.info('Copy the following to channel.seed.ts:\n');

    const output = channelInfos
      .map(
        (info) =>
          `  {\n` +
          `    username: '${info.username}',\n` +
          `    title: '${info.title}',\n` +
          `    description: '${info.description}',\n` +
          `    category: '${info.category}',\n` +
          `    memberCount: '${info.memberCount}',\n` +
          `  },`
      )
      .join('\n');

    console.log(output);

    Logger.info('\n' + '='.repeat(80));
    Logger.info(
      `✅ Successfully extracted ${channelInfos.length}/${CHANNELS_TO_EXTRACT.length} channels`
    );
    Logger.info('='.repeat(80));
  } catch (error) {
    Logger.error('❌ Failed to extract channel info:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.disconnect();
      Logger.info('\n🔌 Disconnected from Telegram');
    }
  }
}

// Run if called directly
if (require.main === module) {
  extractChannelInfo();
}

export { extractChannelInfo };
