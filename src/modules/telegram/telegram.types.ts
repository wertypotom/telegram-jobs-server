export interface TelegramMessage {
  id: string;
  channelId: string;
  text: string;
  date: Date;
}

export interface ChannelInfo {
  id: string;
  username: string;
  title: string;
}
