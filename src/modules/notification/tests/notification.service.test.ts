import { NotificationService } from '../notification.service';
import { User } from '../../user/user.model';
import { TelegramBotService } from '../telegram-bot.service';

// Mock dependencies
jest.mock('../../user/user.model');
jest.mock('../telegram-bot.service');
jest.mock('@utils/logger');

describe('NotificationService', () => {
  let service: NotificationService;
  let mockBotService: jest.Mocked<TelegramBotService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService();
    // Get the singleton instance mock
    mockBotService = (TelegramBotService.getInstance as jest.Mock)();
  });

  describe('findMatchingUsers (Filter Matching)', () => {
    const mockJob = {
      _id: 'job-1',
      parsedData: {
        techStack: ['React', 'Node.js'],
        level: 'Senior',
        isRemote: true,
        normalizedJobTitle: 'Senior Frontend Developer',
      },
    };

    it('should match user with matching stack and level', async () => {
      const mockUser = {
        _id: 'user-1',
        notificationEnabled: true,
        notificationFilters: {
          stack: ['React'],
          level: ['Senior'],
          locationType: ['remote'],
        },
      };

      (User.find as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findMatchingUsers(mockJob as any);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('user-1');
    });

    it('should NOT match user with mismatching stack', async () => {
      const mockUser = {
        _id: 'user-2',
        notificationFilters: {
          stack: ['Python'], // Mismatch
        },
      };

      (User.find as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findMatchingUsers(mockJob as any);
      expect(result).toHaveLength(0);
    });

    it('should NOT match user if remote required but job is on-site', async () => {
      const onSiteJob = {
        ...mockJob,
        parsedData: { ...mockJob.parsedData, isRemote: false },
      };
      const mockUser = {
        _id: 'user-3',
        notificationFilters: {
          locationType: ['remote'], // Requires remote
        },
      };

      (User.find as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findMatchingUsers(onSiteJob as any);
      expect(result).toHaveLength(0);
    });
  });

  describe('canSendNotification (Rate Limits)', () => {
    it('should block if rate limit exceeded (10/hr)', async () => {
      const user = {
        _id: 'user-1',
        lastNotificationSent: new Date(), // Just now
        notificationCount: 10, // Max reached
        save: jest.fn(),
      };

      const result = await service.canSendNotification(user);
      expect(result).toBe(false);
    });

    it('should allow if rate limit not reached', async () => {
      const user = {
        _id: 'user-1',
        lastNotificationSent: new Date(),
        notificationCount: 5,
        save: jest.fn(),
      };

      const result = await service.canSendNotification(user);
      expect(result).toBe(true);
    });

    it('should reset counter if last notification was over 1 hour ago', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const user = {
        _id: 'user-1',
        lastNotificationSent: twoHoursAgo,
        notificationCount: 10, // Should be reset
        save: jest.fn(),
      };

      const result = await service.canSendNotification(user);
      expect(result).toBe(true);
      expect(user.notificationCount).toBe(0);
    });
  });
});
