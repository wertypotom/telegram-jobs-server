export interface ChannelInfo {
  username: string;
  title: string;
  description?: string;
  memberCount?: number;
  isJoined: boolean;
}

export interface RecommendedChannel {
  username: string;
  title: string;
  description: string;
  category: string;
  memberCount: string;
}

export interface SubscribeChannelsRequest {
  channels: string[];
}

export interface SubscribeChannelsResponse {
  success: boolean;
  jobsCount: number;
}
