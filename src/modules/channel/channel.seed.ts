import { Logger } from '@utils/logger';
import { Channel } from './channel.model';
import { RecommendedChannel } from './channel.types';

/**
 * Comprehensive list of 100+ Telegram channels for developer jobs
 * Focused on CIS countries (Russia, Kazakhstan) with both Russian and English channels
 */
export const CHANNEL_SEED_DATA: RecommendedChannel[] = [
  // ============= GENERAL IT & DIGITAL (15 channels) =============
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
    username: '@remotework',
    title: 'Remote Work',
    description: 'Remote IT jobs for developers, designers, marketers',
    category: 'General IT',
    memberCount: '70K+',
  },
  {
    username: '@itfreelance',
    title: 'IT Freelance',
    description: 'Фриланс для IT-специалистов',
    category: 'General IT',
    memberCount: '55K+',
  },
  {
    username: '@remoteok',
    title: 'Remote OK',
    description: 'Remote work opportunities worldwide',
    category: 'General IT',
    memberCount: '40K+',
  },
  {
    username: '@developer_jobs',
    title: 'Developer Jobs',
    description: 'Various developer roles and opportunities',
    category: 'General IT',
    memberCount: '35K+',
  },
  {
    username: '@remote_developers',
    title: 'Remote Developers',
    description: 'Remote developer positions worldwide',
    category: 'General IT',
    memberCount: '30K+',
  },
  {
    username: '@remote_tech_jobs',
    title: 'Remote Tech Jobs',
    description: 'Jobs in the remote tech sector',
    category: 'General IT',
    memberCount: '28K+',
  },
  {
    username: '@partnerkin_job',
    title: 'Вакансии Партнеркин',
    description: 'Вакансии для программистов и маркетологов',
    category: 'General IT',
    memberCount: '25K+',
  },
  {
    username: '@myresume_channel',
    title: 'MyResume - Вакансии',
    description: 'Вакансии и стажировки в IT и Digital от 80K ₽',
    category: 'General IT',
    memberCount: '32K+',
  },
  {
    username: '@thetechkz',
    title: 'The Tech Kazakhstan',
    description: 'IT leaders and jobs in Central Asia',
    category: 'General IT',
    memberCount: '15K+',
  },
  {
    username: '@we_project',
    title: 'Creative Asia',
    description: 'Career and education in Central Asia',
    category: 'General IT',
    memberCount: '20K+',
  },
  {
    username: '@it_vacancies_kz',
    title: 'IT Вакансии Казахстан',
    description: 'Актуальные IT вакансии в Казахстане',
    category: 'General IT',
    memberCount: '12K+',
  },

  // ============= FRONTEND (18 channels) =============
  {
    username: '@frontend_jobs',
    title: 'Frontend Jobs',
    description: 'Frontend development positions',
    category: 'Frontend',
    memberCount: '38K+',
  },
  {
    username: '@job_react',
    title: 'React Job | JavaScript',
    description: 'React and JavaScript developer positions',
    category: 'Frontend',
    memberCount: '42K+',
  },
  {
    username: '@javascript_jobs',
    title: 'JavaScript Jobs',
    description: 'JavaScript, TypeScript, and Node.js opportunities',
    category: 'Frontend',
    memberCount: '45K+',
  },
  {
    username: '@vuejs_jobs_feed',
    title: 'Vue.js Jobs',
    description: 'Vue.js вакансии и резюме',
    category: 'Frontend',
    memberCount: '18K+',
  },
  {
    username: '@angular_jobs_feed',
    title: 'Angular Jobs',
    description: 'Angular вакансии и резюме',
    category: 'Frontend',
    memberCount: '15K+',
  },
  {
    username: '@typescript_jobs',
    title: 'TypeScript Jobs',
    description: 'TypeScript developer positions',
    category: 'Frontend',
    memberCount: '22K+',
  },
  {
    username: '@webdev_jobs',
    title: 'Web Developer Jobs',
    description: 'Web development positions',
    category: 'Frontend',
    memberCount: '28K+',
  },
  {
    username: '@html_css_jobs',
    title: 'HTML/CSS Jobs',
    description: 'Frontend markup and styling positions',
    category: 'Frontend',
    memberCount: '16K+',
  },
  {
    username: '@nextjs_jobs',
    title: 'Next.js Jobs',
    description: 'Next.js and React framework positions',
    category: 'Frontend',
    memberCount: '14K+',
  },
  {
    username: '@webpack_jobs',
    title: 'Webpack & Build Tools',
    description: 'Frontend build tools specialists',
    category: 'Frontend',
    memberCount: '8K+',
  },
  {
    username: '@ux_ui_jobs',
    title: 'UX/UI Developer Jobs',
    description: 'UI/UX development positions',
    category: 'Frontend',
    memberCount: '24K+',
  },
  {
    username: '@svelte_jobs',
    title: 'Svelte Jobs',
    description: 'Svelte framework developer positions',
    category: 'Frontend',
    memberCount: '6K+',
  },
  {
    username: '@nuxt_jobs',
    title: 'Nuxt.js Jobs',
    description: 'Nuxt.js and Vue SSR positions',
    category: 'Frontend',
    memberCount: '7K+',
  },
  {
    username: '@ember_jobs',
    title: 'Ember.js Jobs',
    description: 'Ember.js framework positions',
    category: 'Frontend',
    memberCount: '4K+',
  },
  {
    username: '@sass_less_jobs',
    title: 'SASS/LESS Jobs',
    description: 'CSS preprocessor specialists',
    category: 'Frontend',
    memberCount: '5K+',
  },
  {
    username: '@graphql_jobs',
    title: 'GraphQL Jobs',
    description: 'GraphQL developer positions',
    category: 'Frontend',
    memberCount: '11K+',
  },
  {
    username: '@jamstack_jobs',
    title: 'JAMstack Jobs',
    description: 'JAMstack architecture positions',
    category: 'Frontend',
    memberCount: '9K+',
  },
  {
    username: '@gatsby_jobs',
    title: 'Gatsby Jobs',
    description: 'Gatsby.js developer positions',
    category: 'Frontend',
    memberCount: '5K+',
  },

  // ============= BACKEND (22 channels) =============
  {
    username: '@nodejs_jobs',
    title: 'Node.js Jobs',
    description: 'Backend development with Node.js',
    category: 'Backend',
    memberCount: '35K+',
  },
  {
    username: '@forpython',
    title: 'Python Jobs',
    description: 'Python вакансии',
    category: 'Backend',
    memberCount: '48K+',
  },
  {
    username: '@alljvmjobs',
    title: 'JVM Jobs',
    description: 'Java, Scala, Clojure вакансии',
    category: 'Backend',
    memberCount: '32K+',
  },
  {
    username: '@php_jobs',
    title: 'PHP Jobs',
    description: 'PHP developer positions',
    category: 'Backend',
    memberCount: '26K+',
  },
  {
    username: '@golang_jobs',
    title: 'Golang Jobs',
    description: 'Go language developer positions',
    category: 'Backend',
    memberCount: '30K+',
  },
  {
    username: '@ruby_jobs',
    title: 'Ruby Jobs',
    description: 'Ruby and Rails developer positions',
    category: 'Backend',
    memberCount: '18K+',
  },
  {
    username: '@rust_jobs',
    title: 'Rust Jobs',
    description: 'Rust language developer positions',
    category: 'Backend',
    memberCount: '14K+',
  },
  {
    username: '@dotnet_jobs',
    title: '.NET Jobs',
    description: '.NET and C# developer positions',
    category: 'Backend',
    memberCount: '28K+',
  },
  {
    username: '@cpp_jobs',
    title: 'C++ Jobs',
    description: 'C++ developer positions',
    category: 'Backend',
    memberCount: '24K+',
  },
  {
    username: '@scala_jobs',
    title: 'Scala Jobs',
    description: 'Scala developer positions',
    category: 'Backend',
    memberCount: '12K+',
  },
  {
    username: '@kotlin_backend_jobs',
    title: 'Kotlin Backend Jobs',
    description: 'Kotlin server-side development',
    category: 'Backend',
    memberCount: '10K+',
  },
  {
    username: '@elixir_jobs',
    title: 'Elixir Jobs',
    description: 'Elixir and Phoenix framework positions',
    category: 'Backend',
    memberCount: '8K+',
  },
  {
    username: '@django_jobs',
    title: 'Django Jobs',
    description: 'Django framework developer positions',
    category: 'Backend',
    memberCount: '16K+',
  },
  {
    username: '@flask_jobs',
    title: 'Flask Jobs',
    description: 'Flask framework developer positions',
    category: 'Backend',
    memberCount: '9K+',
  },
  {
    username: '@fastapi_jobs',
    title: 'FastAPI Jobs',
    description: 'FastAPI framework developer positions',
    category: 'Backend',
    memberCount: '11K+',
  },
  {
    username: '@backend_jobs',
    title: 'Backend Jobs',
    description: 'General backend development positions',
    category: 'Backend',
    memberCount: '40K+',
  },
  {
    username: '@spring_jobs',
    title: 'Spring Framework Jobs',
    description: 'Spring and Spring Boot positions',
    category: 'Backend',
    memberCount: '19K+',
  },
  {
    username: '@laravel_jobs',
    title: 'Laravel Jobs',
    description: 'Laravel PHP framework positions',
    category: 'Backend',
    memberCount: '17K+',
  },
  {
    username: '@rails_jobs',
    title: 'Ruby on Rails Jobs',
    description: 'Rails framework developer positions',
    category: 'Backend',
    memberCount: '15K+',
  },
  {
    username: '@express_jobs',
    title: 'Express.js Jobs',
    description: 'Express.js and Node backend positions',
    category: 'Backend',
    memberCount: '13K+',
  },
  {
    username: '@nestjs_jobs',
    title: 'NestJS Jobs',
    description: 'NestJS framework developer positions',
    category: 'Backend',
    memberCount: '12K+',
  },
  {
    username: '@microservices_jobs',
    title: 'Microservices Jobs',
    description: 'Microservices architecture positions',
    category: 'Backend',
    memberCount: '21K+',
  },

  // ============= FULLSTACK (8 channels) =============
  {
    username: '@fullstack_jobs',
    title: 'Full Stack Jobs',
    description: 'Full stack development positions',
    category: 'Fullstack',
    memberCount: '55K+',
  },
  {
    username: '@mern_stack_jobs',
    title: 'MERN Stack Jobs',
    description: 'MongoDB, Express, React, Node positions',
    category: 'Fullstack',
    memberCount: '27K+',
  },
  {
    username: '@mean_stack_jobs',
    title: 'MEAN Stack Jobs',
    description: 'MongoDB, Express, Angular, Node positions',
    category: 'Fullstack',
    memberCount: '19K+',
  },
  {
    username: '@lamp_stack_jobs',
    title: 'LAMP Stack Jobs',
    description: 'Linux, Apache, MySQL, PHP positions',
    category: 'Fullstack',
    memberCount: '14K+',
  },
  {
    username: '@t3_stack_jobs',
    title: 'T3 Stack Jobs',
    description: 'Next.js, TypeScript, tRPC, Prisma positions',
    category: 'Fullstack',
    memberCount: '8K+',
  },
  {
    username: '@lemp_stack_jobs',
    title: 'LEMP Stack Jobs',
    description: 'Linux, Nginx, MySQL, PHP positions',
    category: 'Fullstack',
    memberCount: '10K+',
  },
  {
    username: '@pern_stack_jobs',
    title: 'PERN Stack Jobs',
    description: 'PostgreSQL, Express, React, Node positions',
    category: 'Fullstack',
    memberCount: '13K+',
  },
  {
    username: '@serverless_jobs',
    title: 'Serverless Jobs',
    description: 'Serverless architecture positions',
    category: 'Fullstack',
    memberCount: '11K+',
  },

  // ============= MOBILE (12 channels) =============
  {
    username: '@ios_jobs',
    title: 'iOS Jobs',
    description: 'iOS developer positions',
    category: 'Mobile',
    memberCount: '29K+',
  },
  {
    username: '@android_jobs',
    title: 'Android Jobs',
    description: 'Android developer positions',
    category: 'Mobile',
    memberCount: '31K+',
  },
  {
    username: '@react_native_jobs',
    title: 'React Native Jobs',
    description: 'React Native developer positions',
    category: 'Mobile',
    memberCount: '25K+',
  },
  {
    username: '@flutter_jobs',
    title: 'Flutter Jobs',
    description: 'Flutter/Dart developer positions',
    category: 'Mobile',
    memberCount: '22K+',
  },
  {
    username: '@swift_jobs',
    title: 'Swift Jobs',
    description: 'Swift language developer positions',
    category: 'Mobile',
    memberCount: '17K+',
  },
  {
    username: '@kotlin_jobs',
    title: 'Kotlin Jobs',
    description: 'Kotlin Android developer positions',
    category: 'Mobile',
    memberCount: '20K+',
  },
  {
    username: '@xamarin_jobs',
    title: 'Xamarin Jobs',
    description: 'Xamarin cross-platform positions',
    category: 'Mobile',
    memberCount: '9K+',
  },
  {
    username: '@ionic_jobs',
    title: 'Ionic Jobs',
    description: 'Ionic framework developer positions',
    category: 'Mobile',
    memberCount: '8K+',
  },
  {
    username: '@cordova_jobs',
    title: 'Cordova Jobs',
    description: 'Apache Cordova developer positions',
    category: 'Mobile',
    memberCount: '6K+',
  },
  {
    username: '@swiftui_jobs',
    title: 'SwiftUI Jobs',
    description: 'SwiftUI framework developer positions',
    category: 'Mobile',
    memberCount: '12K+',
  },
  {
    username: '@jetpack_compose_jobs',
    title: 'Jetpack Compose Jobs',
    description: 'Jetpack Compose Android positions',
    category: 'Mobile',
    memberCount: '10K+',
  },
  {
    username: '@mobile_dev_jobs',
    title: 'Mobile Dev Jobs',
    description: 'General mobile development positions',
    category: 'Mobile',
    memberCount: '33K+',
  },

  // ============= DEVOPS & CLOUD (12 channels) =============
  {
    username: '@devops_jobs',
    title: 'DevOps Jobs',
    description: 'DevOps engineer positions',
    category: 'DevOps',
    memberCount: '42K+',
  },
  {
    username: '@kubernetes_jobs',
    title: 'Kubernetes Jobs',
    description: 'Kubernetes specialist positions',
    category: 'DevOps',
    memberCount: '26K+',
  },
  {
    username: '@docker_jobs',
    title: 'Docker Jobs',
    description: 'Docker and containerization positions',
    category: 'DevOps',
    memberCount: '22K+',
  },
  {
    username: '@aws_jobs',
    title: 'AWS Jobs',
    description: 'Amazon Web Services positions',
    category: 'DevOps',
    memberCount: '34K+',
  },
  {
    username: '@azure_jobs',
    title: 'Azure Jobs',
    description: 'Microsoft Azure cloud positions',
    category: 'DevOps',
    memberCount: '24K+',
  },
  {
    username: '@gcp_jobs',
    title: 'GCP Jobs',
    description: 'Google Cloud Platform positions',
    category: 'DevOps',
    memberCount: '18K+',
  },
  {
    username: '@terraform_jobs',
    title: 'Terraform Jobs',
    description: 'Terraform IaC specialist positions',
    category: 'DevOps',
    memberCount: '16K+',
  },
  {
    username: '@ansible_jobs',
    title: 'Ansible Jobs',
    description: 'Ansible automation positions',
    category: 'DevOps',
    memberCount: '14K+',
  },
  {
    username: '@jenkins_jobs',
    title: 'Jenkins Jobs',
    description: 'Jenkins CI/CD specialist positions',
    category: 'DevOps',
    memberCount: '12K+',
  },
  {
    username: '@gitlab_jobs',
    title: 'GitLab Jobs',
    description: 'GitLab DevOps positions',
    category: 'DevOps',
    memberCount: '10K+',
  },
  {
    username: '@cicd_jobs',
    title: 'CI/CD Jobs',
    description: 'CI/CD pipeline specialist positions',
    category: 'DevOps',
    memberCount: '19K+',
  },
  {
    username: '@sre_jobs',
    title: 'SRE Jobs',
    description: 'Site Reliability Engineer positions',
    category: 'DevOps',
    memberCount: '21K+',
  },

  // ============= DATA SCIENCE & AI (10 channels) =============
  {
    username: '@data_science_jobs',
    title: 'Data Science Jobs',
    description: 'Data science and analytics positions',
    category: 'Data Science',
    memberCount: '37K+',
  },
  {
    username: '@ml_jobs',
    title: 'Machine Learning Jobs',
    description: 'ML engineer positions',
    category: 'Data Science',
    memberCount: '33K+',
  },
  {
    username: '@ai_jobs',
    title: 'AI Jobs',
    description: 'Artificial Intelligence positions',
    category: 'Data Science',
    memberCount: '29K+',
  },
  {
    username: '@pytorch_jobs',
    title: 'PyTorch Jobs',
    description: 'PyTorch framework positions',
    category: 'Data Science',
    memberCount: '15K+',
  },
  {
    username: '@tensorflow_jobs',
    title: 'TensorFlow Jobs',
    description: 'TensorFlow framework positions',
    category: 'Data Science',
    memberCount: '17K+',
  },
  {
    username: '@data_analyst_jobs',
    title: 'Data Analyst Jobs',
    description: 'Аналитики и Data Scientist вакансии',
    category: 'Data Science',
    memberCount: '31K+',
  },
  {
    username: '@big_data_jobs',
    title: 'Big Data Jobs',
    description: 'Big Data engineer positions',
    category: 'Data Science',
    memberCount: '24K+',
  },
  {
    username: '@data_engineer_jobs',
    title: 'Data Engineer Jobs',
    description: 'Data engineering positions',
    category: 'Data Science',
    memberCount: '26K+',
  },
  {
    username: '@bi_analyst_jobs',
    title: 'BI Analyst Jobs',
    description: 'Business Intelligence analyst positions',
    category: 'Data Science',
    memberCount: '19K+',
  },
  {
    username: '@nlp_jobs',
    title: 'NLP Jobs',
    description: 'Natural Language Processing positions',
    category: 'Data Science',
    memberCount: '13K+',
  },

  // ============= QA & TESTING (6 channels) =============
  {
    username: '@qa_jobs',
    title: 'QA Jobs',
    description: 'QA engineer and tester positions',
    category: 'QA',
    memberCount: '36K+',
  },
  {
    username: '@automation_qa_jobs',
    title: 'Automation QA Jobs',
    description: 'Test automation positions',
    category: 'QA',
    memberCount: '23K+',
  },
  {
    username: '@selenium_jobs',
    title: 'Selenium Jobs',
    description: 'Selenium test automation positions',
    category: 'QA',
    memberCount: '14K+',
  },
  {
    username: '@manual_qa_jobs',
    title: 'Manual QA Jobs',
    description: 'Manual testing positions',
    category: 'QA',
    memberCount: '18K+',
  },
  {
    username: '@performance_testing_jobs',
    title: 'Performance Testing Jobs',
    description: 'Performance and load testing positions',
    category: 'QA',
    memberCount: '11K+',
  },
  {
    username: '@security_testing_jobs',
    title: 'Security Testing Jobs',
    description: 'Security testing and pentesting positions',
    category: 'QA',
    memberCount: '15K+',
  },

  // ============= GAME DEVELOPMENT (5 channels) =============
  {
    username: '@gamedev_jobs',
    title: 'GameDev Jobs',
    description: 'Работа в геймдеве',
    category: 'GameDev',
    memberCount: '27K+',
  },
  {
    username: '@unity_jobs',
    title: 'Unity Jobs',
    description: 'Unity game developer positions',
    category: 'GameDev',
    memberCount: '21K+',
  },
  {
    username: '@unreal_jobs',
    title: 'Unreal Engine Jobs',
    description: 'Unreal Engine developer positions',
    category: 'GameDev',
    memberCount: '18K+',
  },
  {
    username: '@godot_jobs',
    title: 'Godot Jobs',
    description: 'Godot game engine positions',
    category: 'GameDev',
    memberCount: '7K+',
  },
  {
    username: '@game_design_jobs',
    title: 'Game Design Jobs',
    description: 'Game designer positions',
    category: 'GameDev',
    memberCount: '12K+',
  },

  // ============= INFOSEC & CYBERSECURITY (4 channels) =============
  {
    username: '@infosec_jobs',
    title: 'InfoSec Jobs',
    description: 'Вакансии в информационной безопасности',
    category: 'InfoSec',
    memberCount: '22K+',
  },
  {
    username: '@cybersecurity_jobs',
    title: 'Cybersecurity Jobs',
    description: 'Cybersecurity specialist positions',
    category: 'InfoSec',
    memberCount: '25K+',
  },
  {
    username: '@pentesting_jobs',
    title: 'Pentesting Jobs',
    description: 'Penetration testing positions',
    category: 'InfoSec',
    memberCount: '13K+',
  },
  {
    username: '@blockchain_security_jobs',
    title: 'Blockchain Security Jobs',
    description: 'Blockchain security positions',
    category: 'InfoSec',
    memberCount: '9K+',
  },

  // ============= BLOCKCHAIN & WEB3 (5 channels) =============
  {
    username: '@blockchain_jobs',
    title: 'Blockchain Jobs',
    description: 'Blockchain developer positions',
    category: 'Blockchain',
    memberCount: '24K+',
  },
  {
    username: '@web3_jobs',
    title: 'Web3 Jobs',
    description: 'Web3 and decentralized app positions',
    category: 'Blockchain',
    memberCount: '20K+',
  },
  {
    username: '@solidity_jobs',
    title: 'Solidity Jobs',
    description: 'Smart contract developer positions',
    category: 'Blockchain',
    memberCount: '16K+',
  },
  {
    username: '@ethereum_jobs',
    title: 'Ethereum Jobs',
    description: 'Ethereum developer positions',
    category: 'Blockchain',
    memberCount: '18K+',
  },
  {
    username: '@defi_jobs',
    title: 'DeFi Jobs',
    description: 'Decentralized Finance positions',
    category: 'Blockchain',
    memberCount: '14K+',
  },

  // ============= DATABASE & SYSTEMS (6 channels) =============
  {
    username: '@database_jobs',
    title: 'Database Jobs',
    description: 'Database administrator and engineer positions',
    category: 'Database',
    memberCount: '19K+',
  },
  {
    username: '@postgresql_jobs',
    title: 'PostgreSQL Jobs',
    description: 'PostgreSQL specialist positions',
    category: 'Database',
    memberCount: '14K+',
  },
  {
    username: '@mysql_jobs',
    title: 'MySQL Jobs',
    description: 'MySQL specialist positions',
    category: 'Database',
    memberCount: '12K+',
  },
  {
    username: '@mongodb_jobs',
    title: 'MongoDB Jobs',
    description: 'MongoDB specialist positions',
    category: 'Database',
    memberCount: '16K+',
  },
  {
    username: '@redis_jobs',
    title: 'Redis Jobs',
    description: 'Redis specialist positions',
    category: 'Database',
    memberCount: '9K+',
  },
  {
    username: '@elasticsearch_jobs',
    title: 'Elasticsearch Jobs',
    description: 'Elasticsearch specialist positions',
    category: 'Database',
    memberCount: '11K+',
  },
];

/**
 * Seed the database with comprehensive channel list
 */
export const seedChannels = async (): Promise<void> => {
  try {
    const existingCount = await Channel.countDocuments();

    if (existingCount > 5) {
      Logger.info(`Channels already seeded (${existingCount} channels exist)`);
      return;
    }

    Logger.info('Starting channel seeding with 100+ channels...');

    for (const channelData of CHANNEL_SEED_DATA) {
      try {
        const existing = await Channel.findOne({
          username: channelData.username,
        });

        if (!existing) {
          await Channel.create({
            ...channelData,
            isMonitored: true,
            lastScraped: null,
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
