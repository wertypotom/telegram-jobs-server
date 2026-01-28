# Real Test Examples

Complete test examples extracted from the codebase.

## Service Test: Job Service

[File: job.service.test.ts](file:///Users/werty.potom/Desktop/untitled%20folder/telegram-jobs-server/src/modules/job/tests/job.service.test.ts)

```typescript
import { UserRepository } from '../../user/user.repository';
import { JobRepository } from '../job.repository';
import { JobService } from '../job.service';
import { CreateJobDto } from '../job.types';
import { JobParserService } from '../services/job-parser.service';

jest.mock('../job.repository');
jest.mock('../services/job-parser.service');
jest.mock('../../user/user.repository');
jest.mock('@utils/logger');

describe('JobService', () => {
  let service: JobService;
  let mockJobRepo: jest.Mocked<JobRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockParserService: jest.Mocked<JobParserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobService();
    mockJobRepo = (JobRepository as unknown as jest.Mock).mock.instances[0];
    mockUserRepo = (UserRepository as unknown as jest.Mock).mock.instances[0];
    mockParserService = (JobParserService as unknown as jest.Mock).mock.instances[0];
  });

  describe('createJob', () => {
    const mockJobData: CreateJobDto = {
      telegramMessageId: '123',
      channelId: 'channel-1',
      telegramMessageDate: new Date(),
      rawText: 'Hiring Node.js developer',
      senderUserId: 'sender-1',
    };

    it('should ignore duplicate jobs', async () => {
      mockJobRepo.findByMessageId.mockResolvedValue({ _id: 'existing-job' } as any);

      await service.createJob(mockJobData);

      expect(mockJobRepo.create).not.toHaveBeenCalled();
    });

    it('should create job and trigger async parsing', async () => {
      mockJobRepo.findByMessageId.mockResolvedValue(null);
      mockJobRepo.create.mockResolvedValue({ _id: 'new-job' } as any);
      mockParserService.parseJobText.mockResolvedValue(null);

      await service.createJob(mockJobData);

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending_parse' })
      );
    });
  });

  describe('markJobAsViewed', () => {
    it('should add job to user viewed list if not already viewed', async () => {
      mockUserRepo.findById.mockResolvedValue({ viewedJobs: ['old-job'] } as any);
      mockJobRepo.findById.mockResolvedValue({ _id: 'new-job' } as any);

      await service.markJobAsViewed('user-1', 'new-job');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', {
        viewedJobs: ['old-job', 'new-job'],
      });
    });

    it('should not update if job already viewed', async () => {
      mockUserRepo.findById.mockResolvedValue({ viewedJobs: ['job-1'] } as any);
      mockJobRepo.findById.mockResolvedValue({ _id: 'job-1' } as any);

      await service.markJobAsViewed('user-1', 'job-1');

      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });
});
```

## Service Test: Channel Service

[File: channel.service.test.ts](file:///Users/werty.potom/Desktop/untitled%20folder/telegram-jobs-server/src/modules/channel/tests/channel.service.test.ts)

```typescript
import { UserRepository } from '../../user/user.repository';
import { ChannelRepository } from '../channel.repository';
import { ChannelService } from '../channel.service';

jest.mock('../channel.repository');
jest.mock('../../user/user.repository');
jest.mock('@modules/telegram/services/telegram-client.service');
jest.mock('@modules/scraper/scraper.service');
jest.mock('@utils/logger');

describe('ChannelService', () => {
  let service: ChannelService;
  let mockChannelRepo: jest.Mocked<ChannelRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChannelService();
    mockChannelRepo = (ChannelRepository as unknown as jest.Mock).mock.instances[0];
    mockUserRepo = (UserRepository as unknown as jest.Mock).mock.instances[0];
  });

  describe('subscribeToChannels', () => {
    const mockUser = { _id: 'user-1', plan: 'free', subscribedChannels: [] };

    it('should allow free users up to 5 channels', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockChannelRepo.findByUsername.mockResolvedValue({ _id: 'chan' } as any);

      const channels = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];

      await service.subscribeToChannels('user-1', channels);

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ subscribedChannels: channels })
      );
    });

    it('should block free users from exceeding 5 channels', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      const channels = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'];

      await expect(service.subscribeToChannels('user-1', channels)).rejects.toThrow(
        /Plan limit exceeded/
      );
    });
  });
});
```

## Integration Test: Job Routes

[File: job.routes.test.ts](file:///Users/werty.potom/Desktop/untitled%20folder/telegram-jobs-server/src/modules/job/tests/job.routes.test.ts)

```typescript
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';
import { UserRepository } from '../../user/user.repository';
import { JobRepository } from '../job.repository';

jest.mock('next-auth/jwt');

describe('Job Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: 'test@example.com',
    });
  });

  describe('POST /api/jobs/search', () => {
    beforeEach(async () => {
      const userRepo = new UserRepository();
      await userRepo.create({
        _id: mockUserId,
        email: 'test@example.com',
        subscribedChannels: ['channel-1'],
        viewedJobs: [],
      } as any);

      const jobRepo = new JobRepository();
      await jobRepo.create({
        channelId: 'channel-1',
        telegramMessageId: 'msg-1',
        rawText: 'React Job',
        parsedData: { skills: ['React'], jobType: 'Full-time' },
        status: 'parsed',
        telegramMessageDate: new Date(),
      } as any);
    });

    it('should return only jobs from subscribed channels', async () => {
      const response = await request(app).post('/api/jobs/search').send({});

      expect(response.status).toBe(200);
      const jobs = response.body.data.jobs;
      expect(jobs).toHaveLength(1);
      expect(jobs[0].telegramMessageId).toBe('msg-1');
    });
  });

  describe('POST /api/jobs/:id/view', () => {
    let jobId: string;

    beforeEach(async () => {
      const userRepo = new UserRepository();
      await userRepo.create({
        _id: mockUserId,
        email: 'test@example.com',
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

      const userRepo = new UserRepository();
      const user = await userRepo.findById(mockUserId);
      expect(user?.viewedJobs).toContain(jobId);
    });
  });
});
```
