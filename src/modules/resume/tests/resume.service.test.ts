import { ResumeService } from '../resume.service';
import { UserRepository } from '../../user/user.repository';
import { FileExtractorService } from '../services/file-extractor.service';
import { BadRequestError, NotFoundError } from '@utils/errors';

// Mock dependencies
jest.mock('../../user/user.repository');
jest.mock('../services/file-extractor.service');
jest.mock('@utils/logger');

describe('ResumeService', () => {
  let service: ResumeService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockFileExtractor: jest.Mocked<FileExtractorService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ResumeService();
    mockUserRepo = (UserRepository as unknown as jest.Mock).mock.instances[0];
    mockFileExtractor = (FileExtractorService as unknown as jest.Mock).mock
      .instances[0];
  });

  describe('uploadResume', () => {
    const mockUserId = 'user-1';
    const mockFilePath = '/tmp/resume.pdf';
    const mockMimeType = 'application/pdf';

    it('should upload and process resume successfully', async () => {
      // Mock User
      mockUserRepo.findById.mockResolvedValue({
        _id: mockUserId,
        email: 'test@test.com',
      } as any);

      // Mock Extraction
      mockFileExtractor.extractText.mockResolvedValue(
        '   Extracted Resume Content   '
      );

      const result = await service.uploadResume(
        mockUserId,
        mockFilePath,
        mockMimeType
      );

      // Verify User Update
      expect(mockUserRepo.updateById).toHaveBeenCalledWith(mockUserId, {
        masterResumeText: '   Extracted Resume Content   ',
        masterResumeFileUrl: mockFilePath,
      });

      expect(result.resumeText).toContain('Extracted Resume Content');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        service.uploadResume(mockUserId, mockFilePath, mockMimeType)
      ).rejects.toThrow(/User not found/);
    });

    it('should throw BadRequestError if extraction fails/empty', async () => {
      mockUserRepo.findById.mockResolvedValue({ _id: mockUserId } as any);
      mockFileExtractor.extractText.mockResolvedValue(''); // Empty result

      await expect(
        service.uploadResume(mockUserId, mockFilePath, mockMimeType)
      ).rejects.toThrow(/Could not extract text/);
    });
  });
});
