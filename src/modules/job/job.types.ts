import { IJob, ParsedJobData } from '../../shared/types/common.types';

export interface JobFilterOptions {
  channelIds?: string[]; // Filter by subscribed channels
  stack?: string[];
  level?: string;
  isRemote?: boolean;
  jobFunction?: string;
  excludedTitles?: string[];
  muteKeywords?: string[]; // New: Negative filters (Mute)
  locationType?: string[];
  limit?: number;
  offset?: number;
}

export interface JobListItem {
  id: string;
  channelId: string;
  parsedData?: ParsedJobData;
  createdAt: Date;
  isVisited?: boolean;
}

export interface JobFeedResponse {
  jobs: JobListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateJobDto {
  telegramMessageId: string;
  channelId: string;
  rawText: string;
}
