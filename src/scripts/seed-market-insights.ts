// CRITICAL: Load .env FIRST before any other imports
// NOW import everything else
import { InsightsPageConfigModel } from '@modules/seo-market-insights/market-insights.model';
import { InsightsPageConfig } from '@modules/seo-market-insights/market-insights.types';
import { MarketInsightsStatsRepository } from '@modules/seo-market-insights/market-insights-stats.repository';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Seed Market Insights Pages
 * Creates initial page configurations after validating sufficient data exists
 */

const statsRepo = new MarketInsightsStatsRepository();

const initialPages: Partial<InsightsPageConfig>[] = [
  {
    slug: 'python',
    template: 'category-only',
    filters: { category: 'python' }, // Worldwide
    meta: {
      en: {
        h1: 'Python Job Market Insights - Live Data from Telegram',
        title: 'Python Jobs Worldwide - Market Stats & Trends | JobSniper',
        description:
          'Comprehensive Python job market analysis. 300+ jobs from exclusive Telegram channels. Django vs FastAPI trends, salary data, and skill demands.',
      },
      ru: {
        h1: 'Аналитика рынка Python вакансий - Данные из Telegram',
        title: 'Вакансии Python по всему миру - Статистика рынка | JobSniper',
        description:
          'Комплексный анализ рынка Python. 300+ вакансий из Telegram-каналов. Тренды Django vs FastAPI, зарплаты, востребованные навыки.',
      },
    },
    faq: {
      en: [
        {
          question: 'What is the average Python developer salary?',
          answer:
            'Based on 300+ analyzed jobs, Python developers earn $4,500-$6,500/month on average, with Django specialists trending 15% higher than FastAPI.',
        },
      ],
      ru: [
        {
          question: 'Какая средняя зарплата Python разработчика?',
          answer:
            'На основе анализа 300+ вакансий, Python разработчики зарабатывают $4,500-$6,500/мес, Django специалисты на 15% выше FastAPI.',
        },
      ],
    },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'europe',
    template: 'region-only',
    filters: { region: 'europe' },
    meta: {
      en: {
        h1: 'European Tech Job Market - Live Insights',
        title: 'Tech Jobs in Europe - Market Analysis | JobSniper',
        description:
          'Complete European tech market overview. 500+ jobs across 15 countries from Telegram channels not on LinkedIn.',
      },
      ru: {
        h1: 'Европейский рынок IT вакансий - Аналитика',
        title: 'Tech вакансии в Европе - Анализ рынка | JobSniper',
        description:
          'Полный обзор европейского IT-рынка. 500+ вакансий из 15 стран из Telegram, которых нет на LinkedIn.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'remote',
    template: 'remote-jobs',
    filters: { remote: true },
    meta: {
      en: {
        h1: 'Remote Developer Jobs - Global Opportunities',
        title: 'Remote Tech Jobs Worldwide - Live Market Data | JobSniper',
        description:
          '200+ remote developer positions from Telegram. Full-time remote, async teams, worldwide hiring.',
      },
      ru: {
        h1: 'Удаленные вакансии разработчиков - Глобальные возможности',
        title: 'Удаленные Tech вакансии - Актуальные данные | JobSniper',
        description:
          '200+ удаленных вакансий разработчиков из Telegram. Полная удаленка, async команды, найм по всему миру.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'python/europe',
    template: 'category-region',
    filters: { category: 'python', region: 'europe' },
    meta: {
      en: {
        h1: 'Python Jobs in Europe - Market Insights',
        title: 'Python Developer Jobs in Europe - Live Stats | JobSniper',
        description:
          'Python market analysis for Europe. 150+ jobs, salary trends, top skills demanded across European tech hubs.',
      },
      ru: {
        h1: 'Вакансии Python в Европе - Аналитика рынка',
        title: 'Вакансии Python разработчиков в Европе | JobSniper',
        description:
          'Анализ рынка Python в Европе. 150+ вакансий, зарплатные тренды, топ навыков в европейских tech-хабах.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 5,
  },
  {
    slug: 'javascript',
    template: 'category-only',
    filters: { category: 'javascript' },
    meta: {
      en: {
        h1: 'JavaScript Job Market Insights - Real-Time Data',
        title: 'JavaScript Jobs - Market Stats | JobSniper',
        description:
          'JavaScript developer market analysis from exclusive Telegram channels. Frontend, backend, and full-stack opportunities with salary insights.',
      },
      ru: {
        h1: 'Аналитика рынка JavaScript вакансий - Данные в реальном времени',
        title: 'Вакансии JavaScript - Статистика рынка | JobSniper',
        description:
          'Анализ рынка разработчиков JavaScript из Telegram. Frontend, backend и full-stack позиции с аналитикой зарплат.',
      },
    },
    faq: {
      en: [
        {
          question: 'What is the demand for JavaScript developers?',
          answer:
            'JavaScript remains one of the most in-demand skills, with opportunities across frontend (React, Vue), backend (Node.js), and full-stack roles.',
        },
      ],
      ru: [
        {
          question: 'Какой спрос на JavaScript разработчиков?',
          answer:
            'JavaScript остается одним из самых востребованных навыков с возможностями во frontend (React, Vue), backend (Node.js) и full-stack ролях.',
        },
      ],
    },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'react',
    template: 'category-only',
    filters: { category: 'react' },
    meta: {
      en: {
        h1: 'React Developer Job Market - Live Analytics',
        title: 'React Jobs - Trends & Salary | JobSniper',
        description:
          'React developer market insights from Telegram. Frontend and full-stack positions, salary ranges, and required skills.',
      },
      ru: {
        h1: 'Рынок вакансий React разработчиков - Актуальная аналитика',
        title: 'Вакансии React - Тренды и зарплаты | JobSniper',
        description:
          'Аналитика рынка React разработчиков из Telegram. Frontend и full-stack позиции, диапазоны зарплат, требуемые навыки.',
      },
    },
    faq: {
      en: [
        {
          question: 'What skills are required for React developers?',
          answer:
            'Beyond React, employers typically seek TypeScript, Next.js, state management (Redux/Zustand), and testing experience.',
        },
      ],
      ru: [
        {
          question: 'Какие навыки требуются React разработчикам?',
          answer:
            'Помимо React, работодатели ищут TypeScript, Next.js, state management (Redux/Zustand) и опыт тестирования.',
        },
      ],
    },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'java',
    template: 'category-only',
    filters: { category: 'java' },
    meta: {
      en: {
        h1: 'Java Developer Job Market - Enterprise Opportunities',
        title: 'Java Jobs - Market Analysis | JobSniper',
        description:
          'Java developer market data from Telegram channels. Enterprise, microservices, and cloud-native positions with competitive salaries.',
      },
      ru: {
        h1: 'Рынок вакансий Java разработчиков - Корпоративные возможности',
        title: 'Вакансии Java - Анализ рынка и зарплаты | JobSniper',
        description:
          'Данные рынка Java разработчиков из Telegram. Enterprise, микросервисы и cloud-native позиции с конкурентными зарплатами.',
      },
    },
    faq: {
      en: [
        {
          question: 'What is the average Java developer salary?',
          answer:
            'Java developers, especially those with Spring Boot and microservices experience, command premium salaries in enterprise markets.',
        },
      ],
      ru: [
        {
          question: 'Какая средняя зарплата Java разработчика?',
          answer:
            'Java разработчики, особенно с опытом Spring Boot и микросервисов, получают премиальные зарплаты в корпоративном секторе.',
        },
      ],
    },
    priority: 1,
    minJobCount: 10,
  },
];

async function seedWithValidation() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    Logger.info('Connected to MongoDB');

    Logger.info('Starting market insights seeding with validation...');

    let created = 0;
    let skipped = 0;

    for (const pageConfig of initialPages) {
      // Validate data exists
      const stats = await statsRepo.computeStats(pageConfig.filters!);

      if (stats.totalJobs >= (pageConfig.minJobCount || 20)) {
        // Check if already exists
        const existing = await InsightsPageConfigModel.findOne({ slug: pageConfig.slug });

        if (existing) {
          Logger.info(`Page already exists, skipping: ${pageConfig.slug}`, {
            totalJobs: stats.totalJobs,
          });
          skipped++;
        } else {
          await InsightsPageConfigModel.create(pageConfig);
          Logger.info(`Created insights page: ${pageConfig.slug}`, {
            totalJobs: stats.totalJobs,
            required: pageConfig.minJobCount,
          });
          created++;
        }
      } else {
        Logger.warn(`Skipped ${pageConfig.slug} - insufficient jobs`, {
          actual: stats.totalJobs,
          required: pageConfig.minJobCount,
        });
        skipped++;
      }
    }

    Logger.info('Market insights seeding completed', { created, skipped });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    Logger.error('Failed to seed market insights:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedWithValidation();
