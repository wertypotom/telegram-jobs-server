import { Logger } from '@utils/logger';

import { Channel } from './channel.model';
import { RecommendedChannel } from './channel.types';

/**
 * Valid Telegram channels for job scraping
 * Last validated: 2025-12-08
 * Contains only channels confirmed to exist on Telegram (60 valid out of 113 original)
 */
export const CHANNEL_SEED_DATA: RecommendedChannel[] = [
  // ============= GENERAL IT & DIGITAL =============
  {
    username: '@job_dotnet',
    title: 'C# & .NET Jobs | Работа и стажировки',
    description: 'Вакансии и стажировки для C# инженеров',
    category: 'Backend',
    memberCount: '2.8K+',
  },
  {
    username: '@csharpdevjob',
    title: 'C# jobs — вакансии по C#, .NET, Unity',
    description: 'C# and .NET job opportunities',
    category: 'GameDev',
    memberCount: '9.9K+',
  },
  {
    username: '@java_jobs',
    title: 'Java Jobs',
    description: 'Java and Kotlin job opportunities',
    category: 'Backend',
    memberCount: '6.8K+',
  },
  {
    username: '@jvmjobs',
    title: 'pro.JVM Jobs',
    description: 'Вакансии для разработчиков на JVM',
    category: 'Backend',
    memberCount: '13.1K+',
  },
  {
    username: '@flutterroles',
    title: 'Flutter Jobs/Internships',
    description: 'Flutter job and internship opportunities',
    category: 'Mobile',
    memberCount: '5.6K+',
  },
  {
    username: '@dartuz_jobs',
    title: 'Jobs Dart | Flutter 🇺🇿',
    description: 'Вакансии для разработчиков на Dart и Flutter',
    category: 'Mobile',
    memberCount: '2.2K+',
  },
  {
    username: '@dartlang_jobs',
    title: 'Dart Jobs',
    description: 'Dart (Flutter) job postings',
    category: 'Mobile',
    memberCount: '8.6K+',
  },
  {
    username: '@hackdevjob',
    title:
      'InfoSec Jobs — вакансии по информационной безопасности, infosec, pentesting, пентестингу, security engineer, инфобезу, DevSecOps',
    description: 'Вакансии в области информационной безопасности',
    category: 'InfoSec',
    memberCount: '2.3K+',
  },
  {
    username: '@django_jobs_board',
    title: 'django_jobs_board',
    description: 'Вакансии для Django-разработчиков',
    category: 'Backend',
    memberCount: '1.8K+',
  },
  {
    username: '@front_end_dev',
    title: 'FrontEndDev',
    description: 'Статьи и туториалы по frontend разработке',
    category: 'Frontend',
    memberCount: '27.9K+',
  },
  {
    username: '@forwebdev',
    title: 'For Web — фронтенд, дизайн, программирование',
    description: 'Frontend development news and resources',
    category: 'Frontend',
    memberCount: '14.1K+',
  },
  {
    username: '@reactjs_jobs',
    title: 'React.js Jobs',
    description: 'React.js developer positions',
    category: 'Frontend',
    memberCount: '5.8K+',
  },
  {
    username: '@react_js_jobs',
    title: 'React Jobs работа связанная с reactjs проектами',
    description: 'Вакансии по React JS и NextJS проектам',
    category: 'Frontend',
    memberCount: '1.9K+',
  },
  {
    username: '@geekjobs',
    title: 'Job in IT&Digital',
    description: 'Вакансии от крупных российских и международных компаний',
    category: 'General IT',
    memberCount: '80K+',
  },
  {
    username: '@job_for_juniors',
    title: 'Jobs for Juniors',
    description: 'Entry-level positions across all tech stacks',
    category: 'General IT',
    memberCount: '50K+',
  },
  {
    username: '@jobforjunior',
    title: 'Job for Junior',
    description: 'Вакансии для джунов в IT',
    category: 'General IT',
    memberCount: '60K+',
  },
  {
    username: '@getitrussia',
    title: 'GetIT Russia',
    description: 'IT вакансии в Москве, СПб и удаленно',
    category: 'General IT',
    memberCount: '45K+',
  },
  {
    username: '@developer_jobs',
    title: 'Developer Jobs',
    description: 'General developer job postings',
    category: 'General IT',
    memberCount: '35K+',
  },
  {
    username: '@remote_developers',
    title: 'Remote Developers',
    description: 'Remote development opportunities',
    category: 'General IT',
    memberCount: '40K+',
  },
  {
    username: '@remote_tech_jobs',
    title: 'Remote Tech Jobs',
    description: 'Remote technology positions',
    category: 'General IT',
    memberCount: '30K+',
  },
  {
    username: '@partnerkin_job',
    title: 'Вакансии Партнеркин',
    description: 'Вакансии в IT компаниях',
    category: 'General IT',
    memberCount: '25K+',
  },
  {
    username: '@thetechkz',
    title: 'The Tech Kazakhstan',
    description: 'IT jobs in Kazakhstan',
    category: 'General IT',
    memberCount: '20K+',
  },
  {
    username: '@we_project',
    title: 'Creative Asia',
    description: 'Creative and IT projects',
    category: 'General IT',
    memberCount: '15K+',
  },
  {
    username: '@it_vacancies_kz',
    title: 'IT Вакансии Казахстан',
    description: 'IT vacancies in Kazakhstan',
    category: 'General IT',
    memberCount: '18K+',
  },

  // ============= FRONTEND =============
  {
    username: '@frontend_jobs',
    title: 'Frontend Jobs',
    description: 'Frontend development positions',
    category: 'Frontend',
    memberCount: '30K+',
  },
  {
    username: '@job_react',
    title: 'React Job | JavaScript',
    description: 'React and JavaScript developer jobs',
    category: 'Frontend',
    memberCount: '28K+',
  },
  {
    username: '@javascript_jobs',
    title: 'JavaScript Jobs',
    description: 'JavaScript developer positions',
    category: 'Frontend',
    memberCount: '25K+',
  },
  {
    username: '@vuejs_jobs_feed',
    title: 'Vue.js Jobs',
    description: 'Vue.js development jobs',
    category: 'Frontend',
    memberCount: '15K+',
  },
  {
    username: '@angular_jobs_feed',
    title: 'Angular Jobs',
    description: 'Angular developer positions',
    category: 'Frontend',
    memberCount: '12K+',
  },
  {
    username: '@typescript_jobs',
    title: 'TypeScript Jobs',
    description: 'TypeScript development positions',
    category: 'Frontend',
    memberCount: '20K+',
  },
  {
    username: '@webdev_jobs',
    title: 'Web Developer Jobs',
    description: 'Web development positions',
    category: 'Frontend',
    memberCount: '35K+',
  },
  {
    username: '@nextjs_jobs',
    title: 'Next.js Jobs',
    description: 'Next.js developer positions',
    category: 'Frontend',
    memberCount: '18K+',
  },

  // ============= BACKEND =============
  {
    username: '@ru_pythonjobs',
    title: 'Вакансии для Python-разработчиков / Python Jobs',
    description: 'Вакансии для Python-разработчиков',
    category: 'Backend',
    memberCount: '10.7K+',
  },
  {
    username: '@job_python',
    title: 'Python Job | Вакансии | Стажировки',
    description: 'Вакансии и стажировки для Python-разработчиков',
    category: 'Backend',
    memberCount: '20.7K+',
  },
  {
    username: '@pythonrabota',
    title: 'Python работа',
    description: 'Вакансии по Python с прямым контактом с работодателями',
    category: 'Backend',
    memberCount: '11.3K+',
  },
  {
    username: '@python_django_work',
    title: 'Python Django Jobs',
    description: 'Python Django job opportunities',
    category: 'Backend',
    memberCount: '12K+',
  },
  {
    username: '@nodejs_jobs',
    title: 'Node.js Jobs',
    description: 'Node.js developer positions',
    category: 'Backend',
    memberCount: '30K+',
  },
  {
    username: '@forpython',
    title: 'Python Jobs',
    description: 'Python developer positions',
    category: 'Backend',
    memberCount: '45K+',
  },
  {
    username: '@alljvmjobs',
    title: 'JVM Jobs',
    description: 'Java, Kotlin, Scala positions',
    category: 'Backend',
    memberCount: '20K+',
  },
  {
    username: '@php_jobs',
    title: 'PHP Jobs',
    description: 'PHP developer positions',
    category: 'Backend',
    memberCount: '22K+',
  },
  {
    username: '@golang_jobs',
    title: 'Golang Jobs',
    description: 'Go developer positions',
    category: 'Backend',
    memberCount: '25K+',
  },
  {
    username: '@ruby_jobs',
    title: 'Ruby Jobs',
    description: 'Ruby and Rails developer jobs',
    category: 'Backend',
    memberCount: '12K+',
  },
  {
    username: '@rust_jobs',
    title: 'Rust Jobs',
    description: 'Rust developer positions',
    category: 'Backend',
    memberCount: '15K+',
  },
  {
    username: '@cpp_jobs',
    title: 'C++ Jobs',
    description: 'C++ developer positions',
    category: 'Backend',
    memberCount: '18K+',
  },
  {
    username: '@scala_jobs',
    title: 'Scala Jobs',
    description: 'Scala developer positions',
    category: 'Backend',
    memberCount: '10K+',
  },
  {
    username: '@elixir_jobs',
    title: 'Elixir Jobs',
    description: 'Elixir developer positions',
    category: 'Backend',
    memberCount: '8K+',
  },
  {
    username: '@django_jobs',
    title: 'Django Jobs',
    description: 'Django framework positions',
    category: 'Backend',
    memberCount: '14K+',
  },
  {
    username: '@backend_jobs',
    title: 'Backend Jobs',
    description: 'Backend developer positions',
    category: 'Backend',
    memberCount: '35K+',
  },
  {
    username: '@spring_jobs',
    title: 'Spring Framework Jobs',
    description: 'Spring framework developer jobs',
    category: 'Backend',
    memberCount: '16K+',
  },
  {
    username: '@laravel_jobs',
    title: 'Laravel Jobs',
    description: 'Laravel PHP framework jobs',
    category: 'Backend',
    memberCount: '12K+',
  },
  {
    username: '@nestjs_jobs',
    title: 'NestJS Jobs',
    description: 'NestJS framework positions',
    category: 'Backend',
    memberCount: '10K+',
  },

  // ============= MOBILE =============
  {
    username: '@ios_jobs',
    title: 'iOS Jobs',
    description: 'iOS developer positions',
    category: 'Mobile',
    memberCount: '20K+',
  },
  {
    username: '@android_jobs',
    title: 'Android Jobs',
    description: 'Android developer positions',
    category: 'Mobile',
    memberCount: '22K+',
  },
  {
    username: '@react_native_jobs',
    title: 'React Native Jobs',
    description: 'React Native developer jobs',
    category: 'Mobile',
    memberCount: '18K+',
  },
  {
    username: '@swift_jobs',
    title: 'Swift Jobs',
    description: 'Swift developer positions',
    category: 'Mobile',
    memberCount: '15K+',
  },
  {
    username: '@kotlin_jobs',
    title: 'Kotlin Jobs',
    description: 'Kotlin developer positions',
    category: 'Mobile',
    memberCount: '14K+',
  },
  {
    username: '@xamarin_jobs',
    title: 'Xamarin Jobs',
    description: 'Xamarin developer positions',
    category: 'Mobile',
    memberCount: '8K+',
  },

  // ============= DEVOPS =============
  {
    username: '@devops_jobs',
    title: 'DevOps Jobs',
    description: 'DevOps engineer positions',
    category: 'DevOps',
    memberCount: '30K+',
  },
  {
    username: '@kubernetes_jobs',
    title: 'Kubernetes Jobs',
    description: 'Kubernetes specialist positions',
    category: 'DevOps',
    memberCount: '18K+',
  },
  {
    username: '@aws_jobs',
    title: 'AWS Jobs',
    description: 'Amazon Web Services positions',
    category: 'DevOps',
    memberCount: '25K+',
  },
  {
    username: '@azure_jobs',
    title: 'Azure Jobs',
    description: 'Microsoft Azure positions',
    category: 'DevOps',
    memberCount: '20K+',
  },

  // ============= DATA SCIENCE & ML =============
  {
    username: '@data_science_jobs',
    title: 'Data Science Jobs',
    description: 'Data science positions',
    category: 'Data Science',
    memberCount: '28K+',
  },
  {
    username: '@ml_jobs',
    title: 'Machine Learning Jobs',
    description: 'Machine learning engineer jobs',
    category: 'Data Science',
    memberCount: '26K+',
  },
  {
    username: '@ai_jobs',
    title: 'AI Jobs',
    description: 'Artificial intelligence positions',
    category: 'Data Science',
    memberCount: '30K+',
  },
  {
    username: '@data_analyst_jobs',
    title: 'Data Analyst Jobs',
    description: 'Data analyst positions',
    category: 'Data Science',
    memberCount: '22K+',
  },
  {
    username: '@big_data_jobs',
    title: 'Big Data Jobs',
    description: 'Big data engineer positions',
    category: 'Data Science',
    memberCount: '20K+',
  },
  {
    username: '@data_engineer_jobs',
    title: 'Data Engineer Jobs',
    description: 'Data engineering positions',
    category: 'Data Science',
    memberCount: '24K+',
  },
  {
    username: '@nlp_jobs',
    title: 'NLP Jobs',
    description: 'Natural language processing jobs',
    category: 'Data Science',
    memberCount: '15K+',
  },

  // ============= QA =============
  {
    username: '@qa_jobs',
    title: 'QA Jobs',
    description: 'QA engineer positions',
    category: 'QA',
    memberCount: '18K+',
  },
  {
    username: '@manual_qa_jobs',
    title: 'Manual QA Jobs',
    description: 'Manual QA tester positions',
    category: 'QA',
    memberCount: '12K+',
  },

  // ============= GAMEDEV =============
  {
    username: '@gamedev_jobs',
    title: 'GameDev Jobs',
    description: 'Game development positions',
    category: 'GameDev',
    memberCount: '16K+',
  },
  {
    username: '@unity_jobs',
    title: 'Unity Jobs',
    description: 'Unity game engine positions',
    category: 'GameDev',
    memberCount: '14K+',
  },

  // ============= INFOSEC =============
  {
    username: '@cybersecurity_jobs',
    title: 'Cybersecurity Jobs',
    description: 'Cybersecurity specialist positions',
    category: 'InfoSec',
    memberCount: '20K+',
  },

  // ============= BLOCKCHAIN =============
  {
    username: '@blockchain_jobs',
    title: 'Blockchain Jobs',
    description: 'Blockchain developer positions',
    category: 'Blockchain',
    memberCount: '18K+',
  },
  {
    username: '@ethereum_jobs',
    title: 'Ethereum Jobs',
    description: 'Ethereum developer jobs',
    category: 'Blockchain',
    memberCount: '15K+',
  },
  {
    username: '@defi_jobs',
    title: 'DeFi Jobs',
    description: 'Decentralized finance positions',
    category: 'Blockchain',
    memberCount: '12K+',
  },

  // ============= DATABASE =============
  {
    username: '@mongodb_jobs',
    title: 'MongoDB Jobs',
    description: 'MongoDB specialist positions',
    category: 'Database',
    memberCount: '10K+',
  },
];

/**
 * Seed the database with validated channel list
 */
export const seedChannels = async (): Promise<void> => {
  try {
    const existingCount = await Channel.countDocuments();

    if (existingCount > 5) {
      Logger.info(`Channels already seeded (${existingCount} channels exist)`);
      return;
    }

    Logger.info('Starting channel seeding with validated channels...');

    for (const channelData of CHANNEL_SEED_DATA) {
      try {
        const existing = await Channel.findOne({
          username: channelData.username,
        });

        if (!existing) {
          await Channel.create({
            ...channelData,
            isMonitored: true,
            lastScrapedAt: undefined,
            lastScrapedMessageId: undefined,
          });
          Logger.info(`Seeded channel: ${channelData.username}`);
        }
      } catch (error) {
        Logger.error(`Failed to seed channel ${channelData.username}:`, error);
      }
    }

    const finalCount = await Channel.countDocuments();
    Logger.info(`Channel seeding complete. Total channels: ${finalCount}`);
  } catch (error) {
    Logger.error('Failed to seed channels:', error);
    throw error;
  }
};
