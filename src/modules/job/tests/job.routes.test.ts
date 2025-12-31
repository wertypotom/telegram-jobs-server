import request from 'supertest';
import app from '../../../app';
import { getToken } from 'next-auth/jwt';
import { JobRepository } from '../job.repository';
import { UserRepository } from '../../user/user.repository';
import mongoose from 'mongoose';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');

describe('Job Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUserEmail = 'test@example.com';
  let accessTokenSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Default auth mock
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: mockUserEmail,
    });
  });

  describe('GET /api/jobs/skills/search', () => {
    it('should return matching skills', async () => {
      const response = await request(app).get('/api/jobs/skills/search?q=node');
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.arrayContaining(['Node.js']));
    });

    it('should return default skills if no query', async () => {
      const response = await request(app).get('/api/jobs/skills/search');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/jobs/search', () => {
    beforeEach(async () => {
      // Seed User
      const userRepo = new UserRepository();
      await userRepo.create({
        _id: mockUserId,
        email: mockUserEmail,
        name: 'Test User',
        subscribedChannels: ['channel-1'],
        viewedJobs: [],
      } as any);

      // Seed Jobs
      const jobRepo = new JobRepository();
      await jobRepo.create({
        channelId: 'channel-1',
        telegramMessageId: 'msg-1',
        rawText: 'React Job',
        parsedData: {
          skills: ['React'],
          jobType: 'Full-time',
        },
        status: 'parsed',
        telegramMessageDate: new Date(),
      } as any);

      await jobRepo.create({
        channelId: 'channel-2', // Not subscribed
        telegramMessageId: 'msg-2',
        rawText: 'Java Job',
        parsedData: {
          skills: ['Java'],
        },
        status: 'parsed',
        telegramMessageDate: new Date(),
      } as any);
    });

    it('should return only jobs from subscribed channels', async () => {
      const response = await request(app).post('/api/jobs/search').send({}); // Empty filter

      expect(response.status).toBe(200);
      const jobs = response.body.data.jobs;
      expect(jobs).toHaveLength(1);
      expect(jobs[0].telegramMessageId).toBe('msg-1');
    });

    it('should filter jobs by stack', async () => {
      const response = await request(app)
        .post('/api/jobs/search')
        .send({ stack: ['React'] });

      expect(response.status).toBe(200);
      const jobs = response.body.data.jobs;
      expect(jobs).toHaveLength(1);
      expect(jobs[0].telegramMessageId).toBe('msg-1');
    });
  });

  describe('POST /api/jobs/:id/view', () => {
    let jobId: string;

    beforeEach(async () => {
      // Seed User & Job
      const userRepo = new UserRepository();
      await userRepo.create({
        _id: mockUserId,
        email: mockUserEmail,
        viewedJobs: [],
      } as any);

      const jobRepo = new JobRepository();
      const job = await jobRepo.create({
        channelId: 'channel-1',
        telegramMessageId: 'msg-1',
        rawText: 'Test Job',
        status: 'parsed',
        telegramMessageDate: new Date(),
      } as any);
      jobId = job._id.toString();
    });

    it('should mark job as viewed', async () => {
      const response = await request(app).post(`/api/jobs/${jobId}/view`);
      expect(response.status).toBe(200);

      // Verify DB
      const userRepo = new UserRepository();
      const user = await userRepo.findById(mockUserId);
      expect(user?.viewedJobs).toContain(jobId);
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).post(`/api/jobs/${fakeId}/view`);
      expect(response.status).toBe(404);
    });
  });
});
