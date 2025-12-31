import { Channel } from '@modules/channel/channel.model';

import { BundleRepository } from '../bundle.repository';
import { BundleService } from '../bundle.service';

// Mock dependencies
jest.mock('../bundle.repository');
jest.mock('@modules/channel/channel.model');
jest.mock('@utils/logger');

describe('BundleService', () => {
  let service: BundleService;
  let mockBundleRepo: jest.Mocked<BundleRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BundleService();
    mockBundleRepo = (BundleRepository as unknown as jest.Mock).mock.instances[0];

    // Default Channel mocks
    (Channel.findOne as jest.Mock).mockImplementation(() => ({
      username: 'mock',
    }));
    (Channel.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      }),
    });
  });

  describe('getAllBundles', () => {
    const mockBundles = [
      {
        id: 'bundle-1',
        title: 'Dev Bundle',
        channels: ['ch1', 'ch2'],
        category: 'dev',
        order: 1,
      },
    ];

    it('should return bundles with validated channels', async () => {
      mockBundleRepo.findAll.mockResolvedValue(mockBundles as any);
      // All channels exist
      (Channel.findOne as jest.Mock).mockResolvedValue({ username: 'exist' });

      const result = await service.getAllBundles();

      expect(result).toHaveLength(1);
      expect(result[0].channels).toEqual(['ch1', 'ch2']);
    });

    it('should replace missing channels with others from same category', async () => {
      mockBundleRepo.findAll.mockResolvedValue(mockBundles as any);

      // ch1 exists, ch2 missing
      (Channel.findOne as jest.Mock).mockImplementation(({ username }) => {
        return username === 'ch1' ? Promise.resolve({ username }) : Promise.resolve(null);
      });

      // Replacement finding
      const mockReplacements = [{ username: 'replacement1' }];
      (Channel.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockReplacements),
        }),
      });

      const result = await service.getAllBundles();

      expect(result[0].channels).toHaveLength(2);
      expect(result[0].channels).toContain('ch1');
      expect(result[0].channels).toContain('replacement1');
      expect(result[0].channels).not.toContain('ch2');
    });
  });

  describe('getBundleById', () => {
    const mockBundle = {
      id: 'bundle-1',
      title: 'Dev Bundle',
      channels: ['ch1'],
      category: 'dev',
      order: 1,
    };

    it('should return bundle if found', async () => {
      mockBundleRepo.findById.mockResolvedValue(mockBundle as any);
      (Channel.findOne as jest.Mock).mockResolvedValue({ username: 'ch1' });

      const result = await service.getBundleById('bundle-1');

      expect(result.id).toBe('bundle-1');
    });

    it('should throw NotFoundError if bundle not found', async () => {
      mockBundleRepo.findById.mockResolvedValue(null);

      await expect(service.getBundleById('invalid')).rejects.toThrow(/not found/);
    });
  });
});
