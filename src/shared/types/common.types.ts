export interface IUser {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  masterResumeText?: string;
  masterResumeFileUrl?: string;
  subscribedChannels: string[];

  hasCompletedOnboarding: boolean;
  viewedJobs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob {
  _id: string;
  telegramMessageId: string;
  channelId: string;
  rawText: string;
  parsedData?: ParsedJobData;
  status: 'pending_parse' | 'parsed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedJobData {
  jobTitle?: string;
  company?: string;
  techStack?: string[];
  salary?: string;
  contactMethod?: string;
  isRemote?: boolean;
  level?: string;
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
