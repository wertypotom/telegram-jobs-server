import { IJob } from '../../shared/types/common.types';

export interface JobFilterOptions {
  stack?: string;
  level?: string;
  isRemote?: boolean;
  jobFunction?: string;
  excludedTitles?: string[];
  locationType?: string[];
  limit?: number;
  offset?: number;
}

export interface JobFeedResponse {
  jobs: IJob[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateJobDto {
  telegramMessageId: string;
  channelId: string;
  rawText: string;
}
