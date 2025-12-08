import { Channel, IChannelDocument } from './channel.model';
import { Logger } from '@utils/logger';

export class ChannelRepository {
  async findByUsername(username: string): Promise<IChannelDocument | null> {
    return Channel.findOne({ username });
  }

  async findMonitored(): Promise<IChannelDocument[]> {
    return Channel.find({ isMonitored: true });
  }

  async create(data: Partial<IChannelDocument>): Promise<IChannelDocument> {
    const channel = new Channel(data);
    return channel.save();
  }

  async update(
    username: string,
    data: Partial<IChannelDocument>
  ): Promise<IChannelDocument | null> {
    return Channel.findOneAndUpdate({ username }, data, { new: true });
  }

  async upsert(data: Partial<IChannelDocument>): Promise<IChannelDocument> {
    const existing = await this.findByUsername(data.username!);
    if (existing) {
      return this.update(data.username!, data) as Promise<IChannelDocument>;
    }
    return this.create(data);
  }

  async updateLastScraped(username: string): Promise<void> {
    await Channel.updateOne({ username }, { lastScrapedAt: new Date() });
  }

  async findAll(filter: any = {}): Promise<IChannelDocument[]> {
    return Channel.find(filter);
  }

  async countMonitored(): Promise<number> {
    return Channel.countDocuments({ isMonitored: true });
  }
}
