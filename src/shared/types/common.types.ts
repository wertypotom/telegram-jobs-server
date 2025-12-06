export interface IUser {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  masterResumeText?: string;
  masterResumeFileUrl?: string;
  subscribedChannels: string[];
  plan: 'free' | 'premium';

  hasCompletedOnboarding: boolean;
  viewedJobs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob {
  _id: string;
  telegramMessageId: string;
  channelId: string;
  senderUserId?: string;
  senderUsername?: string;
  rawText: string;
  parsedData?: ParsedJobData;
  status: 'pending_parse' | 'parsed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  telegram?: string; // Username (e.g., @username)
  email?: string;
  applicationUrl?: string;
  other?: string;
}

export interface ParsedJobData {
  jobTitle?: string; // Original title (any language)
  normalizedJobTitle?: string; // English normalized title for filtering
  company?: string;
  techStack: string[];
  salary?: string;
  contactInfo?: ContactInfo;
  isRemote?: boolean;
  level?: string;
  employmentType?: string;
  location?: string; // Company location
  candidateLocation?: string; // Where candidate should be based
  responsibilities?: string[]; // What the job entails
  requiredQualifications?: string[]; // Must-have skills
  preferredQualifications?: string[]; // Nice-to-have skills
  benefits?: string[]; // Perks, additional compensation
  description?: string; // Clean summary without hashtags/emojis
  experienceYears?: number; // Required years of experience
}

export interface IChannel {
  _id: string;
  username: string; // @react_jobs
  title: string; // "React Jobs Official"
  description?: string; // Channel description
  memberCount?: number; // Number of subscribers
  isMonitored: boolean; // Is server actively scraping?
  lastScrapedAt?: Date; // Last successful scrape timestamp
  createdAt: Date;
  updatedAt: Date;
}
