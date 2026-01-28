// CRITICAL: Load .env FIRST before any other imports
// NOW import everything else
import { InsightsPageConfigModel } from '@modules/seo-market-insights/market-insights.model';
import { InsightsPageConfig } from '@modules/seo-market-insights/market-insights.types';
import { MarketInsightsStatsRepository } from '@modules/seo-market-insights/market-insights-stats.repository';
import { envConfig } from '@shared/config/env.config';
import { Logger } from '@utils/logger';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const statsRepo = new MarketInsightsStatsRepository();

const initialPages: Partial<InsightsPageConfig>[] = [
  // === EXISTING PAGES ===
  {
    slug: 'python',
    template: 'category-only',
    filters: { category: 'python' },
    meta: {
      en: {
        h1: 'Python Job Market Insights - Live Data from Telegram',
        title: 'Python Jobs Worldwide - Market Stats | JobSniper',
        description:
          'Python job market analysis from Telegram. Django, FastAPI trends, salary data, and skill demands.',
      },
      ru: {
        h1: 'Аналитика рынка Python вакансий - Данные из Telegram',
        title: 'Вакансии Python - Статистика рынка | JobSniper',
        description:
          'Анализ рынка Python из Telegram. Тренды Django vs FastAPI, зарплаты, востребованные навыки.',
      },
    },
    faq: {
      en: [
        {
          question: 'What is the average Python developer salary?',
          answer:
            'Python developers earn $4,500-$6,500/month on average, with Django specialists trending 15% higher than FastAPI.',
        },
      ],
      ru: [
        {
          question: 'Какая средняя зарплата Python разработчика?',
          answer:
            'Python разработчики зарабатывают $4,500-$6,500/мес, Django специалисты на 15% выше FastAPI.',
        },
      ],
    },
    priority: 1,
    minJobCount: 10,
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
          'JavaScript developer market from Telegram. Frontend, backend, full-stack opportunities with salaries.',
      },
      ru: {
        h1: 'Аналитика рынка JavaScript вакансий',
        title: 'Вакансии JavaScript - Статистика | JobSniper',
        description:
          'Рынок разработчиков JavaScript из Telegram. Frontend, backend и full-stack позиции с зарплатами.',
      },
    },
    faq: {
      en: [
        {
          question: 'What is the demand for JavaScript developers?',
          answer:
            'JavaScript remains highly in-demand across frontend (React, Vue), backend (Node.js), and full-stack roles.',
        },
      ],
      ru: [
        {
          question: 'Какой спрос на JavaScript разработчиков?',
          answer:
            'JavaScript остается востребованным во frontend (React, Vue), backend (Node.js) и full-stack ролях.',
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
          'React developer insights from Telegram. Frontend and full-stack positions, salary ranges, skills.',
      },
      ru: {
        h1: 'Рынок вакансий React разработчиков',
        title: 'Вакансии React - Тренды | JobSniper',
        description:
          'Аналитика React разработчиков из Telegram. Frontend и full-stack позиции, зарплаты, навыки.',
      },
    },
    faq: {
      en: [
        {
          question: 'What skills are required for React developers?',
          answer:
            'TypeScript, Next.js, state management (Redux/Zustand), and testing are typically required.',
        },
      ],
      ru: [
        {
          question: 'Какие навыки требуются React разработчикам?',
          answer: 'TypeScript, Next.js, state management (Redux/Zustand) и опыт тестирования.',
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
          'Java developer data from Telegram. Enterprise, microservices, cloud-native positions with salaries.',
      },
      ru: {
        h1: 'Рынок вакансий Java разработчиков',
        title: 'Вакансии Java - Анализ рынка | JobSniper',
        description:
          'Данные Java разработчиков из Telegram. Enterprise, микросервисы и cloud-native позиции.',
      },
    },
    faq: {
      en: [
        {
          question: 'What is the average Java developer salary?',
          answer:
            'Java developers with Spring Boot and microservices experience command premium salaries in enterprise.',
        },
      ],
      ru: [
        {
          question: 'Какая средняя зарплата Java разработчика?',
          answer:
            'Java разработчики с опытом Spring Boot получают премиальные зарплаты в корпорациях.',
        },
      ],
    },
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
        title: 'Remote Tech Jobs - Live Data | JobSniper',
        description:
          'Remote developer positions from Telegram. Full-time remote, async teams, worldwide hiring.',
      },
      ru: {
        h1: 'Удаленные вакансии разработчиков',
        title: 'Удаленные Tech вакансии | JobSniper',
        description:
          'Удаленные вакансии разработчиков из Telegram. Полная удаленка, async команды.',
      },
    },
    faq: { en: [], ru: [] },
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
        title: 'Tech Jobs in Europe - Analysis | JobSniper',
        description:
          'European tech market from Telegram. Jobs across 15 countries not on LinkedIn.',
      },
      ru: {
        h1: 'Европейский рынок IT вакансий',
        title: 'Tech вакансии в Европе | JobSniper',
        description: 'Обзор европейского IT-рынка из Telegram. Вакансии из 15 стран.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },

  // === NEW TECH STACK PAGES ===
  {
    slug: 'typescript',
    template: 'category-only',
    filters: { category: 'typescript' },
    meta: {
      en: {
        h1: 'TypeScript Jobs - Market Insights',
        title: 'TypeScript Jobs - Trends & Stats | JobSniper',
        description:
          'TypeScript developer market from Telegram. Frontend, backend positions with salary insights.',
      },
      ru: {
        h1: 'Вакансии TypeScript - Аналитика рынка',
        title: 'Вакансии TypeScript - Тренды | JobSniper',
        description:
          'Рынок TypeScript разработчиков из Telegram. Frontend, backend позиции с зарплатами.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'nodejs',
    template: 'category-only',
    filters: { category: 'nodejs' },
    meta: {
      en: {
        h1: 'Node.js Developer Jobs - Backend Market',
        title: 'Node.js Jobs - Market Data | JobSniper',
        description:
          'Node.js backend jobs from Telegram. API development, microservices, salaries.',
      },
      ru: {
        h1: 'Вакансии Node.js разработчиков',
        title: 'Вакансии Node.js - Данные | JobSniper',
        description: 'Backend вакансии Node.js из Telegram. API, микросервисы, зарплаты.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'golang',
    template: 'category-only',
    filters: { category: 'golang' },
    meta: {
      en: {
        h1: 'Go Developer Jobs - Modern Backend',
        title: 'Go/Golang Jobs - Market Stats | JobSniper',
        description:
          'Go developer market from Telegram. Backend, systems programming, cloud services.',
      },
      ru: {
        h1: 'Вакансии Go разработчиков',
        title: 'Вакансии Go/Golang - Статистика | JobSniper',
        description: 'Рынок Go разработчиков из Telegram. Backend, системное программирование.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'php',
    template: 'category-only',
    filters: { category: 'php' },
    meta: {
      en: {
        h1: 'PHP Developer Jobs - Web Development',
        title: 'PHP Jobs - Market Analysis | JobSniper',
        description:
          'PHP developer opportunities from Telegram. Laravel, Symfony, WordPress positions.',
      },
      ru: {
        h1: 'Вакансии PHP разработчиков',
        title: 'Вакансии PHP - Анализ | JobSniper',
        description: 'Возможности PHP разработчиков из Telegram. Laravel, Symfony, WordPress.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'dotnet',
    template: 'category-only',
    filters: { category: 'dotnet' },
    meta: {
      en: {
        h1: '.NET Developer Jobs - Enterprise Market',
        title: '.NET Jobs - Market Insights | JobSniper',
        description:
          '.NET developer positions from Telegram. C#, ASP.NET, enterprise applications.',
      },
      ru: {
        h1: 'Вакансии .NET разработчиков',
        title: 'Вакансии .NET - Аналитика | JobSniper',
        description:
          'Позиции .NET разработчиков из Telegram. C#, ASP.NET, корпоративные приложения.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'vue',
    template: 'category-only',
    filters: { category: 'vue' },
    meta: {
      en: {
        h1: 'Vue.js Developer Jobs - Frontend Market',
        title: 'Vue.js Jobs - Trends & Stats | JobSniper',
        description:
          'Vue.js frontend jobs from Telegram. Vue 3, Nuxt.js positions with salary data.',
      },
      ru: {
        h1: 'Вакансии Vue.js разработчиков',
        title: 'Вакансии Vue.js - Тренды | JobSniper',
        description: 'Frontend вакансии Vue.js из Telegram. Vue 3, Nuxt.js позиции с зарплатами.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'angular',
    template: 'category-only',
    filters: { category: 'angular' },
    meta: {
      en: {
        h1: 'Angular Developer Jobs - Enterprise Frontend',
        title: 'Angular Jobs - Market Data | JobSniper',
        description:
          'Angular developer market from Telegram. Enterprise frontend positions, TypeScript.',
      },
      ru: {
        h1: 'Вакансии Angular разработчиков',
        title: 'Вакансии Angular - Данные | JobSniper',
        description: 'Рынок Angular разработчиков из Telegram. Enterprise frontend, TypeScript.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'docker',
    template: 'category-only',
    filters: { category: 'docker' },
    meta: {
      en: {
        h1: 'Docker Jobs - DevOps & Containerization',
        title: 'Docker Jobs - Market Insights | JobSniper',
        description:
          'Docker positions from Telegram. DevOps, containerization, microservices roles.',
      },
      ru: {
        h1: 'Вакансии Docker - DevOps',
        title: 'Вакансии Docker - Аналитика | JobSniper',
        description: 'Позиции Docker из Telegram. DevOps, контейнеризация, микросервисы.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'kubernetes',
    template: 'category-only',
    filters: { category: 'kubernetes' },
    meta: {
      en: {
        h1: 'Kubernetes Jobs - Cloud Infrastructure',
        title: 'Kubernetes Jobs - Market Stats | JobSniper',
        description:
          'Kubernetes positions from Telegram. DevOps, cloud infrastructure, orchestration.',
      },
      ru: {
        h1: 'Вакансии Kubernetes - Облачная инфраструктура',
        title: 'Вакансии Kubernetes - Статистика | JobSniper',
        description:
          'Позиции Kubernetes из Telegram. DevOps, облачная инфраструктура, оркестрация.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'aws',
    template: 'category-only',
    filters: { category: 'aws' },
    meta: {
      en: {
        h1: 'AWS Jobs - Cloud Platform Opportunities',
        title: 'AWS Jobs - Market Analysis | JobSniper',
        description: 'AWS cloud jobs from Telegram. DevOps, cloud architects, solutions engineers.',
      },
      ru: {
        h1: 'Вакансии AWS - Облачная платформа',
        title: 'Вакансии AWS - Анализ | JobSniper',
        description: 'Облачные вакансии AWS из Telegram. DevOps, облачные архитекторы, инженеры.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'postgresql',
    template: 'category-only',
    filters: { category: 'postgresql' },
    meta: {
      en: {
        h1: 'PostgreSQL Jobs - Database Market',
        title: 'PostgreSQL Jobs - Market Data | JobSniper',
        description:
          'PostgreSQL database jobs from Telegram. DBAs, backend developers, data engineers.',
      },
      ru: {
        h1: 'Вакансии PostgreSQL - Рынок баз данных',
        title: 'Вакансии PostgreSQL - Данные | JobSniper',
        description: 'Вакансии PostgreSQL из Telegram. DBA, backend разработчики, data инженеры.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'mongodb',
    template: 'category-only',
    filters: { category: 'mongodb' },
    meta: {
      en: {
        h1: 'MongoDB Jobs - NoSQL Database Market',
        title: 'MongoDB Jobs - Market Insights | JobSniper',
        description:
          'MongoDB NoSQL jobs from Telegram. Backend developers, database administrators.',
      },
      ru: {
        h1: 'Вакансии MongoDB - NoSQL рынок',
        title: 'Вакансии MongoDB - Аналитика | JobSniper',
        description: 'NoSQL вакансии MongoDB из Telegram. Backend разработчики, администраторы БД.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },

  // === COMBINATION PAGES ===
  {
    slug: 'python/remote',
    template: 'category-region',
    filters: { category: 'python', remote: true },
    meta: {
      en: {
        h1: 'Remote Python Jobs - Work From Anywhere',
        title: 'Remote Python Jobs - Market Data | JobSniper',
        description:
          'Remote Python positions from Telegram. Django, FastAPI, data science, worldwide hiring.',
      },
      ru: {
        h1: 'Удаленные вакансии Python',
        title: 'Удаленные вакансии Python | JobSniper',
        description:
          'Удаленные позиции Python из Telegram. Django, FastAPI, data science, найм по всему миру.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 5,
  },
  {
    slug: 'javascript/remote',
    template: 'category-region',
    filters: { category: 'javascript', remote: true },
    meta: {
      en: {
        h1: 'Remote JavaScript Jobs - Global Opportunities',
        title: 'Remote JavaScript Jobs - Stats | JobSniper',
        description:
          'Remote JavaScript positions from Telegram. Frontend, backend, full-stack, worldwide.',
      },
      ru: {
        h1: 'Удаленные вакансии JavaScript',
        title: 'Удаленные вакансии JavaScript | JobSniper',
        description:
          'Удаленные позиции JavaScript из Telegram. Frontend, backend, full-stack, по всему миру.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 5,
  },
  {
    slug: 'react/remote',
    template: 'category-region',
    filters: { category: 'react', remote: true },
    meta: {
      en: {
        h1: 'Remote React Jobs - Frontend Opportunities',
        title: 'Remote React Jobs - Market Data | JobSniper',
        description:
          'Remote React developer jobs from Telegram. Frontend, full-stack positions worldwide.',
      },
      ru: {
        h1: 'Удаленные вакансии React',
        title: 'Удаленные вакансии React | JobSniper',
        description:
          'Удаленные вакансии React из Telegram. Frontend, full-stack позиции по всему миру.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 5,
  },
  {
    slug: 'python/europe',
    template: 'category-region',
    filters: { category: 'python', region: 'europe' },
    meta: {
      en: {
        h1: 'Python Jobs in Europe - Market Insights',
        title: 'Python Jobs in Europe - Stats | JobSniper',
        description:
          'Python market in Europe from Telegram. Salary trends, skills across European tech hubs.',
      },
      ru: {
        h1: 'Вакансии Python в Европе',
        title: 'Вакансии Python в Европе | JobSniper',
        description:
          'Рынок Python в Европе из Telegram. Зарплаты, навыки в европейских tech-хабах.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 5,
  },

  // === EXPERIENCE LEVEL PAGES ===
  {
    slug: 'senior',
    template: 'general-insight',
    filters: { level: 'senior' },
    meta: {
      en: {
        h1: 'Senior Developer Jobs - Leadership Roles',
        title: 'Senior Developer Jobs - Market Data | JobSniper',
        description:
          'Senior developer positions from Telegram. Tech leads, architects, high salaries.',
      },
      ru: {
        h1: 'Вакансии Senior разработчиков',
        title: 'Вакансии Senior разработчиков | JobSniper',
        description:
          'Позиции Senior разработчиков из Telegram. Tech leads, архитекторы, высокие зарплаты.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'junior',
    template: 'general-insight',
    filters: { level: 'junior' },
    meta: {
      en: {
        h1: 'Junior Developer Jobs - Entry Level',
        title: 'Junior Developer Jobs - Market Stats | JobSniper',
        description:
          'Junior developer positions from Telegram. Entry-level opportunities, internships.',
      },
      ru: {
        h1: 'Вакансии Junior разработчиков',
        title: 'Вакансии Junior разработчиков | JobSniper',
        description:
          'Позиции Junior разработчиков из Telegram. Entry-level возможности, стажировки.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
  {
    slug: 'lead',
    template: 'general-insight',
    filters: { level: 'lead' },
    meta: {
      en: {
        h1: 'Tech Lead Jobs - Team Leadership',
        title: 'Tech Lead Jobs - Market Insights | JobSniper',
        description:
          'Tech lead positions from Telegram. Team management, architecture, premium salaries.',
      },
      ru: {
        h1: 'Вакансии Tech Lead',
        title: 'Вакансии Tech Lead - Аналитика | JobSniper',
        description:
          'Позиции Tech lead из Telegram. Управление командой, архитектура, премиальные зарплаты.',
      },
    },
    faq: { en: [], ru: [] },
    priority: 1,
    minJobCount: 10,
  },
];

async function seedWithValidation() {
  try {
    await mongoose.connect(envConfig.mongodbUri);
    Logger.info('Connected to MongoDB');
    Logger.info('Starting market insights seeding with validation...');

    let created = 0;
    let skipped = 0;

    for (const pageConfig of initialPages) {
      const stats = await statsRepo.computeStats(pageConfig.filters!);

      if (stats.totalJobs >= (pageConfig.minJobCount || 20)) {
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
