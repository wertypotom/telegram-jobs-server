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
  {
    username: '@devitjobs',
    title: 'DevITJobs.uk - Software Developer & IT Jobs in London and the United Kingdom (UK)',
    description: 'Software developer and IT jobs in the UK',
    category: 'General IT',
    memberCount: '9.5K+',
  },
  {
    username: '@germantechjobs',
    title: 'GermanTechJobs.de - IT & Developer jobs in Germany',
    description: 'IT and developer jobs in Germany',
    category: 'General IT',
    memberCount: '13.9K+',
  },
  {
    username: '@relocateme',
    title: 'Relocate.Me: Jobs & Moving Abroad',
    description: 'International job opportunities and relocation resources',
    category: 'General IT',
    memberCount: '32.6K+',
  },
  {
    username: '@jobs_abroad',
    title: 'Jobs abroad',
    description: 'Job opportunities abroad',
    category: 'General IT',
    memberCount: '14.8K+',
  },
  {
    username: '@rusecjobs',
    title: 'RuSecJobs Channel',
    description: 'Вакансии в сфере информационной безопасности',
    category: 'InfoSec',
    memberCount: '10K+',
  },
  {
    username: '@it_jobs_kz',
    title: 'IT Jobs (DSML.KZ)',
    description: 'IT vacancies in Kazakhstan and worldwide',
    category: 'General IT',
    memberCount: '7.4K+',
  },
  {
    username: '@ml_jobs_kz',
    title: 'AIMoLdin Jobs (DSML.KZ)',
    description: 'Data Science vacancies in Kazakhstan and worldwide',
    category: 'Data Science',
    memberCount: '9.4K+',
  },
  {
    username: '@normrabota',
    title: 'Норм работа',
    description: 'Вакансии в digital сфере',
    category: 'General IT',
    memberCount: '109K+',
  },
  {
    username: '@gogetajob',
    title: 'Go Get A Job',
    description: 'Вакансии для разработчиков на языке Go (Golang)',
    category: 'Backend',
    memberCount: '5.9K+',
  },
  {
    username: '@projects_jobs',
    title: 'Projects Jobs — вакансии и аналитика',
    description: 'Вакансии по управлению проектами и рисками',
    category: 'General IT',
    memberCount: '18.2K+',
  },
  {
    username: '@jobfortm',
    title: 'Job for IT-TOP (Technical Managers)',
    description: 'Вакансии для технических руководителей',
    category: 'General IT',
    memberCount: '12K+',
  },
  {
    username: '@digital_hr',
    title: 'DigitalHR: работа | вакансии | рекрутинг в IT, Digital, Product, Design, стартапы',
    description: 'Вакансии в IT, Digital, Product и Design',
    category: 'General IT',
    memberCount: '27.2K+',
  },
  {
    username: '@seohr',
    title: 'SEO HR, digital-вакансии, офис и удалёнка',
    description: 'Digital job vacancies, office and remote positions',
    category: 'General IT',
    memberCount: '20.4K+',
  },
  {
    username: '@marketing_jobs',
    title: '🎯 marketing jobs — вакансии для маркетологов',
    description: 'Вакансии для маркетологов и digital-специалистов',
    category: 'General IT',
    memberCount: '50.5K+',
  },
  {
    username: '@analysts_hunter',
    title: 'Работа ищет аналитиков // Вакансии',
    description: 'Вакансии для аналитиков',
    category: 'Data Science',
    memberCount: '25.7K+',
  },
  {
    username: '@analyst_job',
    title: 'Работа для Системных и Бизнес-аналитиков',
    description: 'Вакансии для системных и бизнес-аналитиков',
    category: 'General IT',
    memberCount: '31.2K+',
  },
  {
    username: '@remotelist',
    title: 'Remotelist',
    description: 'Вакансии с удаленной работой',
    category: 'General IT',
    memberCount: '1.4K+',
  },
  {
    username: '@remoteit',
    title: 'Remote IT (Inflow)',
    description: 'Вакансии для IT специалистов на удаленку',
    category: 'General IT',
    memberCount: '44K+',
  },
  {
    username: '@relocation_jobs',
    title: 'משרות רילוקיישן - Relocation Jobs',
    description: 'Relocation job opportunities worldwide',
    category: 'General IT',
    memberCount: '550+',
  },
  {
    username: '@dsmlkz_news',
    title: 'DSML.KZ Новости',
    description: 'Новости Data & AI сообщества DSML KZ',
    category: 'Data Science',
    memberCount: '3.8K+',
  },
  {
    username: '@mobile_jobs',
    title: 'Mobile Dev Jobs — вакансии и резюме',
    description: 'Вакансии для мобильных разработчиков iOS и Android',
    category: 'Mobile',
    memberCount: '20.5K+',
  },
  {
    username: '@microsoftstackjobs',
    title: 'Microsoft Stack Jobs',
    description: 'Microsoft Stack job opportunities',
    category: 'Backend',
    memberCount: '2K+',
  },
  {
    username: '@remotejobpositions',
    title: 'Remote Job Positions',
    description: 'Remote job opportunities',
    category: 'General IT',
    memberCount: '3.2K+',
  },
  {
    username: '@devitjobs',
    title: 'DevITJobs.uk - Software Developer & IT Jobs in London and the United Kingdom (UK)',
    description: 'Software developer and IT jobs in the UK',
    category: 'General IT',
    memberCount: '9.5K+',
  },
  {
    username: '@remotedevjobs',
    title: 'Remote Dev Jobs',
    description: 'Remote jobs for software developers',
    category: 'General IT',
    memberCount: '1.5K+',
  },
  {
    username: '@jobinswiss',
    title: 'Job in Swiss / Arbeit in der Schweiz 🇨🇭',
    description: 'Job opportunities in Switzerland',
    category: 'General IT',
    memberCount: '486+',
  },
  {
    username: '@relocats',
    title: 'IT Relocation (Inflow)',
    description: 'Вакансии с переездом за границу для IT-специалистов',
    category: 'General IT',
    memberCount: '27K+',
  },
  {
    username: '@serbia_jobs',
    title: 'Serbia IT Jobs [RU/UA/ENG]',
    description: 'IT job opportunities in Serbia',
    category: 'General IT',
    memberCount: '10.5K+',
  },
  {
    username: '@evacuatejobs',
    title: 'Remocate: релокация, удалёнка, работа и вакансии',
    description: 'Удалённая работа и вакансии для релокации',
    category: 'General IT',
    memberCount: '112.4K+',
  },
  {
    username: '@technomajed',
    title: 'IT Jobs وظائف تَقنيّة',
    description: 'Technical job opportunities',
    category: 'General IT',
    memberCount: '16.1K+',
  },
  {
    username: '@layboard_in',
    title: 'Work abroad - Layboard.in',
    description: 'Overseas job opportunities for South Asian citizens',
    category: 'General IT',
    memberCount: '9.5K+',
  },
  {
    username: '@secretproductdesignerjobs',
    title: 'Secret Product Designer Jobs 🕵🏻‍♂️',
    description: 'Product Designer positions in Israel',
    category: 'General IT',
    memberCount: '211+',
  },
  {
    username: '@digital_marketingca',
    title: 'Digital marketing Agency',
    description: 'Digital marketing job opportunities',
    category: 'General IT',
    memberCount: '6.7K+',
  },
  {
    username: '@job_akvelon',
    title: 'AKVELON JOB | Software Engineering Company',
    description: 'Software engineering job opportunities at Akvelon',
    category: 'General IT',
    memberCount: '4.5K+',
  },
  {
    username: '@germantechjobs',
    title: 'GermanTechJobs.de - IT & Developer jobs in Germany',
    description: 'IT and developer jobs in Germany',
    category: 'General IT',
    memberCount: '13.9K+',
  },
  {
    username: '@web3_job',
    title: 'The Reliable Jobs',
    description: 'Job opportunities in various fields',
    category: 'Blockchain',
    memberCount: '6.2K+',
  },
  {
    username: '@technomajed',
    title: 'IT Jobs وظائف تَقنيّة',
    description: 'Technical job opportunities',
    category: 'General IT',
    memberCount: '16.1K+',
  },
  {
    username: '@remoteit',
    title: 'Remote IT (Inflow)',
    description: 'Вакансии для IT специалистов на удаленку',
    category: 'General IT',
    memberCount: '44K+',
  },
  {
    username: '@remotejobpositions',
    title: 'Remote Job Positions',
    description: 'Remote job positions',
    category: 'General IT',
    memberCount: '3.2K+',
  },
  {
    username: '@remotedevjobs',
    title: 'Remote Dev Jobs',
    description: 'Remote jobs for software developers',
    category: 'General IT',
    memberCount: '1.5K+',
  },
  {
    username: '@technomajed',
    title: 'IT Jobs وظائف تَقنيّة',
    description: 'Technical job opportunities',
    category: 'General IT',
    memberCount: '16.1K+',
  },
  {
    username: '@dubai_hiring',
    title: 'Dubai Hiring - Вакансии лучших работодателей ОАЭ.',
    description: 'Вакансии от работодателей ОАЭ',
    category: 'General IT',
    memberCount: '1.7K+',
  },
  {
    username: '@uae_career',
    title: 'Jobs in uae',
    description: 'Job opportunities in the UAE',
    category: 'General IT',
    memberCount: '600+',
  },
  {
    username: '@programadores_br',
    title: 'Programadores BR',
    description: 'Вакансии для программистов в Бразилии',
    category: 'General IT',
    memberCount: '3+',
  },
  {
    username: '@snatchjobs',
    title: 'Snatchjobs (SG Part Timers)',
    description: 'Part-time job opportunities in Singapore',
    category: 'General IT',
    memberCount: '3.5K+',
  },
  {
    username: '@nomadstays',
    title: 'Nomad Stays Community',
    description: 'Accommodation industry discussions and opportunities',
    category: 'General IT',
    memberCount: '29+',
  },
  {
    username: '@relocats',
    title: 'IT Relocation (Inflow)',
    description: 'Вакансии с переездом за границу для IT-специалистов',
    category: 'General IT',
    memberCount: '27K+',
  },
  {
    username: '@codenjobs',
    title: 'Remote Job - Code & Jobs Notification Channel',
    description: 'Remote tech job notifications',
    category: 'General IT',
    memberCount: '189+',
  },
  {
    username: '@thedevs',
    title: 'The Devs',
    description: 'Developers community and job opportunities',
    category: 'General IT',
    memberCount: '33.6K+',
  },
  {
    username: '@vacancy_it_ulbitv',
    title: 'Вакансии в IT (Айти) | Рефералки в IT | By Ulbi TV',
    description: 'Вакансии в IT и рефералки в компании',
    category: 'General IT',
    memberCount: '17K+',
  },
  {
    username: '@uxui_jobs',
    title: 'UX UI design - вакансии и резюме',
    description: 'Вакансии и резюме по UX/UI дизайну',
    category: 'General IT',
    memberCount: '4.2K+',
  },
  {
    username: '@gamedev_job',
    title: 'Работа в геймдеве',
    description: 'Вакансии в геймдеве',
    category: 'GameDev',
    memberCount: '2.8K+',
  },
  {
    username: '@sysadmin_jobs',
    title: 'sysadmin_jobs',
    description: 'Вакансии для системных администраторов',
    category: 'General IT',
    memberCount: '3.8K+',
  },
  {
    username: '@devops_jobs',
    title: 'DevOps Jobs - работа и аналитика',
    description: 'DevOps and SRE job listings and market insights',
    category: 'DevOps',
    memberCount: '18.6K+',
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
