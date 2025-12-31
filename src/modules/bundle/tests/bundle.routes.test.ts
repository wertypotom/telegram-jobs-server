import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';
import { ChannelRepository } from '../../channel/channel.repository';
import { BundleRepository } from '../bundle.repository';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');
// Mock Telegram/Scraper services
jest.mock('@modules/telegram/services/telegram-client.service');
jest.mock('@modules/scraper/scraper.service');

describe('Bundle Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: 'test@example.com',
    });
  });

  describe('GET /api/bundles', () => {
    it('should return seeded bundles with valid channels', async () => {
      // Seed Channels
      const channelRepo = new ChannelRepository();
      await channelRepo.create({
        username: 'react_jobs',
        title: 'React Jobs',
        isMonitored: true,
        category: 'dev',
      } as any);

      // Seed Bundle
      const bundleRepo = new BundleRepository();
      await bundleRepo.create({
        id: 'dev-bundle',
        title: 'Dev Bundle',
        description: 'Test Bundle',
        icon: 'test-icon',
        channels: ['react_jobs'],
        category: 'dev',
        order: 1,
      } as any);

      const response = await request(app).get('/api/bundles');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].channels).toContain('react_jobs');
    });

    it('should handle bundles with missing channels dynamically', async () => {
      // Seed Channels (two available in dev category)
      const channelRepo = new ChannelRepository();
      await channelRepo.create({
        username: 'react_jobs',
        title: 'React Jobs',
        isMonitored: true,
        category: 'dev',
      } as any);
      await channelRepo.create({
        username: 'node_jobs',
        title: 'Node Jobs',
        isMonitored: true,
        category: 'dev',
      } as any);

      // Seed Bundle with one missing channel ('missing_channel')
      // 'react_jobs' is present. 'missing_channel' is not.
      // Dynamic validation should replace 'missing_channel' with 'node_jobs' (same category)
      const bundleRepo = new BundleRepository();
      await bundleRepo.create({
        id: 'dev-bundle-2',
        title: 'Dev Bundle 2',
        description: 'Test Bundle 2',
        icon: 'test-icon',
        channels: ['react_jobs', 'missing_channel'],
        category: 'dev',
        order: 1,
      } as any);

      const response = await request(app).get('/api/bundles');
      expect(response.status).toBe(200);

      const bundle = response.body.data[0];
      expect(bundle.channels).toHaveLength(2);
      expect(bundle.channels).toContain('react_jobs');
      expect(bundle.channels).toContain('node_jobs'); // Replaced
      expect(bundle.channels).not.toContain('missing_channel');
    });
  });
});
