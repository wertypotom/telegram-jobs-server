export interface JobParsingPayload {
  telegramMessageId: string;
  channelId: string;
  senderUserId?: string;
  senderUsername?: string;
  rawText: string;
  telegramMessageDate: Date;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export const QUEUE_NAMES = {
  JOB_PARSING: 'job-parsing',
} as const;
