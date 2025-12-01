import { UserRepository } from '@modules/user/user.repository';
import { FileExtractorService } from './services/file-extractor.service';
import { ResumeUploadResponse } from './resume.types';
import { BadRequestError, NotFoundError } from '@utils/errors';
import { Logger } from '@utils/logger';

export class ResumeService {
  private userRepository: UserRepository;
  private fileExtractor: FileExtractorService;

  constructor() {
    this.userRepository = new UserRepository();
    this.fileExtractor = new FileExtractorService();
  }

  async uploadResume(
    userId: string,
    filePath: string,
    mimeType: string
  ): Promise<ResumeUploadResponse> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Extract text from resume
    const resumeText = await this.fileExtractor.extractText(filePath, mimeType);

    if (!resumeText || resumeText.trim().length === 0) {
      throw new BadRequestError('Could not extract text from resume');
    }

    // Update user with resume data
    await this.userRepository.updateById(userId, {
      masterResumeText: resumeText,
      masterResumeFileUrl: filePath,
    });

    Logger.info('Resume uploaded successfully', { userId, textLength: resumeText.length });

    return {
      message: 'Resume uploaded and processed successfully',
      resumeText: resumeText.substring(0, 500) + '...', // Return preview
      fileUrl: filePath,
    };
  }
}
