import { SniperService } from '../sniper.service';
import { UserRepository } from '../../user/user.repository';
import { JobRepository } from '../../job/job.repository';
import { AiTailorService } from '../services/ai-tailor.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { DocxGeneratorService } from '../services/docx-generator.service';

// Mock dependencies
jest.mock('../../user/user.repository');
jest.mock('../../job/job.repository');
jest.mock('../services/ai-tailor.service');
jest.mock('../services/pdf-generator.service');
jest.mock('../services/docx-generator.service');
jest.mock('@utils/logger');

describe('SniperService', () => {
  let service: SniperService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockJobRepo: jest.Mocked<JobRepository>;
  let mockAiTailor: jest.Mocked<AiTailorService>;
  let mockPdfGen: jest.Mocked<PdfGeneratorService>;
  let mockDocxGen: jest.Mocked<DocxGeneratorService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SniperService();
    mockUserRepo = (UserRepository as unknown as jest.Mock).mock.instances[0];
    mockJobRepo = (JobRepository as unknown as jest.Mock).mock.instances[0];
    mockAiTailor = (AiTailorService as unknown as jest.Mock).mock.instances[0];
    mockPdfGen = (PdfGeneratorService as unknown as jest.Mock).mock
      .instances[0];
    mockDocxGen = (DocxGeneratorService as unknown as jest.Mock).mock
      .instances[0];
  });

  describe('generateTailoredResume', () => {
    const mockUser = {
      _id: 'user-1',
      email: 'test@test.com',
      masterResumeText: 'Master Resume Content',
    };

    const mockJob = {
      _id: 'job-1',
      rawText: 'Job Description',
      parsedData: {
        jobTitle: 'Dev',
        company: 'Corp',
        techStack: ['React'],
        isRemote: true,
      },
    };

    const mockTailoredContent = {
      summary: 'Tailored Summary',
      skills: ['React'],
      telegramMessage: 'Hi',
      coverLetter: 'Dear Hiring Manager',
    };

    it('should generate tailored documents successfully', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockJobRepo.findById.mockResolvedValue(mockJob as any);
      mockAiTailor.tailorResume.mockResolvedValue(mockTailoredContent);
      mockPdfGen.generateResume.mockResolvedValue('/path/to/resume.pdf');
      mockDocxGen.generateResume.mockResolvedValue('/path/to/resume.docx');

      const result = await service.generateTailoredResume('user-1', 'job-1');

      // Check return values
      expect(result.pdfUrl).toContain('resume.pdf');
      expect(result.docxUrl).toContain('resume.docx');
      expect(result.telegramMessage).toBe('Hi');

      // Check modifications were called
      expect(mockAiTailor.tailorResume).toHaveBeenCalledWith(
        mockUser.masterResumeText,
        expect.stringContaining('Job Title: Dev')
      );
    });

    it('should throw BadRequestError if user has no master resume', async () => {
      mockUserRepo.findById.mockResolvedValue({
        ...mockUser,
        masterResumeText: null,
      } as any);

      await expect(
        service.generateTailoredResume('user-1', 'job-1')
      ).rejects.toThrow(/upload your master resume/);
    });

    it('should throw BadRequestError if job is not parsed', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockJobRepo.findById.mockResolvedValue({
        ...mockJob,
        parsedData: null,
      } as any);

      await expect(
        service.generateTailoredResume('user-1', 'job-1')
      ).rejects.toThrow(/Job has not been parsed/);
    });
  });
});
