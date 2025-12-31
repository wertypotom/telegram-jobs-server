import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';
import { UserRepository } from '../../user/user.repository';
import { ChannelRepository } from '../channel.repository';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');
// Mock TelegramClientService to prevent connection attempts
jest.mock('@modules/telegram/services/telegram-client.service');
jest.mock('@modules/scraper/scraper.service');

describe('Channel Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUserEmail = 'test@example.com';

  beforeEach(async () => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: mockUserEmail,
    });
  });

  describe('POST /api/channels/subscribe', () => {
    beforeEach(async () => {
      // Seed User
      const userRepo = new UserRepository();
      await userRepo.create({
        _id: mockUserId,
        email: mockUserEmail,
        plan: 'free',
        subscribedChannels: [],
      } as any);

      // Seed Channels
      const channelRepo = new ChannelRepository();
      await channelRepo.create({
        username: 'valid_channel',
        title: 'Valid Channel',
        isMonitored: true,
      } as any);
    });

    it('should subscribe user to valid channels', async () => {
      const response = await request(app)
        .post('/api/channels/subscribe')
        .send({ channels: ['valid_channel'] });

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);

      const userRepo = new UserRepository();
      const user = await userRepo.findById(mockUserId);
      expect(user?.subscribedChannels).toContain('valid_channel');
    });

    it('should reject invalid channels', async () => {
      const response = await request(app)
        .post('/api/channels/subscribe')
        .send({ channels: ['invalid_channel'] });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toMatch(/not available/);
    });

    it('should enforce free plan limits', async () => {
      // Create 6 valid channels
      const channelRepo = new ChannelRepository();
      const channels = [];
      for (let i = 0; i < 6; i++) {
        const name = `ch${i}`;
        await channelRepo.create({
          username: name,
          title: name,
          isMonitored: true,
        } as any);
        channels.push(name);
      }

      const response = await request(app).post('/api/channels/subscribe').send({ channels });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toMatch(/Plan limit exceeded/);
    });
  });
});
