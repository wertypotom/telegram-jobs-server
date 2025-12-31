import { UserPreferencesRepository } from '../user-preferences.repository';
import { UserPreferencesService } from '../user-preferences.service';

// Mock repository
jest.mock('../user-preferences.repository');

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let mockRepository: jest.Mocked<UserPreferencesRepository>;

  const mockUserId = 'user-123';
  const mockFilters = {
    stack: ['React'],
    level: ['Senior'],
    locationType: ['Remote'],
    jobFunction: [],
    excludedTitles: [],
    muteKeywords: [],
  };

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Initialize service (which internally instantiates the mocked repo)
    service = new UserPreferencesService();

    // Get the instance of the mock
    mockRepository = (UserPreferencesRepository as unknown as jest.Mock).mock.instances[0];
  });

  describe('getFilters', () => {
    it('should return default filters if no preferences found', async () => {
      // Setup mock to return null
      mockRepository.findByUserId.mockResolvedValue(null);

      const filters = await service.getFilters(mockUserId);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(filters).toEqual({
        jobFunction: [],
        level: [],
        stack: [],
        locationType: [],
        excludedTitles: [],
        muteKeywords: [],
      });
    });

    it('should return saved filters if preferences exist', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        userId: mockUserId,
        jobFilters: mockFilters,
      } as any);

      const filters = await service.getFilters(mockUserId);

      expect(filters).toEqual(mockFilters);
    });
  });

  describe('saveFilters', () => {
    it('should save and return filters', async () => {
      mockRepository.upsertFilters.mockResolvedValue({
        userId: mockUserId,
        jobFilters: mockFilters,
      } as any);

      const filters = await service.saveFilters(mockUserId, mockFilters);

      expect(mockRepository.upsertFilters).toHaveBeenCalledWith(mockUserId, mockFilters);
      expect(filters).toEqual(mockFilters);
    });
  });
});
