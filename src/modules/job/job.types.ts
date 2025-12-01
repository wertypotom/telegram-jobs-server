import { IJob } from '../../shared/types/common.types';

export interface JobFilterOptions {
  stack?: string;
  level?: string;
  isRemote?: boolean;
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
