import { UserRepository } from '../../user/user.repository';
import { ChannelRepository } from '../channel.repository';
import { ChannelService } from '../channel.service';

// Mock dependencies
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
    const mockUser = {
      _id: 'user-1',
      plan: 'free',
      subscribedChannels: [],
    };

    it('should allow free users up to 5 channels', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockChannelRepo.findByUsername.mockResolvedValue({
        username: 'ch1',
      } as any);

      const channels = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];
      // Mock validation for all channels
      mockChannelRepo.findByUsername.mockResolvedValue({ _id: 'chan' } as any);

      await service.subscribeToChannels('user-1', channels);

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          subscribedChannels: channels,
        })
      );
    });

    it('should block free users from exceeding 5 channels', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      const channels = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'];

      await expect(service.subscribeToChannels('user-1', channels)).rejects.toThrow(
        /Plan limit exceeded/
      );
    });

    it('should allow premium users unlimited channels', async () => {
      mockUserRepo.findById.mockResolvedValue({
        ...mockUser,
        plan: 'premium',
      } as any);
      // Mock validation
      mockChannelRepo.findByUsername.mockResolvedValue({ _id: 'chan' } as any);

      // 10 channels
      const channels = Array.from({ length: 10 }, (_, i) => `ch${i}`);

      await service.subscribeToChannels('user-1', channels);

      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('should validate all channels exist', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockChannelRepo.findByUsername
        .mockResolvedValueOnce({ _id: 'valid' } as any)
        .mockResolvedValueOnce(null); // Second channel invalid

      await expect(service.subscribeToChannels('user-1', ['valid', 'invalid'])).rejects.toThrow(
        /not available/
      );
    });
  });

  describe('addChannels (Swap Logic)', () => {
    it('should consume swap for free users', async () => {
      const user = {
        _id: 'user-1',
        plan: 'free',
        hasCompletedOnboarding: true,
        subscribedChannels: ['old1'],
        subscriptionChanges: { count: 0, lastResetDate: new Date() },
      };
      mockUserRepo.findById.mockResolvedValue(user as any);
      mockChannelRepo.findByUsername.mockResolvedValue({} as any);

      await service.addChannels('user-1', ['new1']);

      // Expect swap count incremented
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          subscriptionChanges: expect.objectContaining({ count: 1 }),
        })
      );
    });

    it('should block if swap limit exceeded', async () => {
      const user = {
        _id: 'user-1',
        plan: 'free',
        hasCompletedOnboarding: true,
        subscribedChannels: ['old1'],
        subscriptionChanges: { count: 6, lastResetDate: new Date() }, // Max is 6
      };
      mockUserRepo.findById.mockResolvedValue(user as any);

      await expect(service.addChannels('user-1', ['new1'])).rejects.toThrow(
        /used all 6 channel swaps/
      );
    });

    it('should not consume swap for premium users', async () => {
      const user = {
        _id: 'user-1',
        plan: 'premium',
        hasCompletedOnboarding: true,
        subscribedChannels: ['old1'],
        subscriptionChanges: { count: 0, lastResetDate: new Date() },
      };
      mockUserRepo.findById.mockResolvedValue(user as any);
      mockChannelRepo.findByUsername.mockResolvedValue({} as any);

      await service.addChannels('user-1', ['new1']);

      // Should NOT update subscriptionChanges
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.not.objectContaining({
          subscriptionChanges: expect.anything(),
        })
      );
    });
  });
});
