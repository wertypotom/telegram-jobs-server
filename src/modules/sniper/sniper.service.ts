import { UserRepository } from '@modules/user/user.repository';
import { JobRepository } from '@modules/job/job.repository';
import { AiTailorService } from './services/ai-tailor.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { DocxGeneratorService } from './services/docx-generator.service';
import { TailoredResumeResponse } from './sniper.types';
import { BadRequestError, NotFoundError } from '@utils/errors';
import { Logger } from '@utils/logger';

export class SniperService {
  private userRepository: UserRepository;
  private jobRepository: JobRepository;
  private aiTailor: AiTailorService;
  private pdfGenerator: PdfGeneratorService;
  private docxGenerator: DocxGeneratorService;

  constructor() {
    this.userRepository = new UserRepository();
    this.jobRepository = new JobRepository();
    this.aiTailor = new AiTailorService();
    this.pdfGenerator = new PdfGeneratorService();
    this.docxGenerator = new DocxGeneratorService();
  }

  async generateTailoredResume(userId: string, jobId: string): Promise<TailoredResumeResponse> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has master resume
    if (!user.masterResumeText) {
      throw new BadRequestError('Please upload your master resume first');
    }

    // Get job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (!job.parsedData) {
      throw new BadRequestError('Job has not been parsed yet');
    }

    // Build job description from parsed data
    const jobDescription = this.buildJobDescription(job);

    // Tailor resume with AI
    const tailoredContent = await this.aiTailor.tailorResume(user.masterResumeText, jobDescription);

    // Extract basic info from master resume (simplified - in production, parse properly)
    const name = user.email.split('@')[0]; // Placeholder
    const email = user.email;

    // Generate PDF
    const pdfPath = await this.pdfGenerator.generateResume({
      name,
      email,
      summary: tailoredContent.summary,
      skills: tailoredContent.skills,
      experience: user.masterResumeText.substring(0, 500), // Simplified
    });

    // Generate DOCX
    const docxPath = await this.docxGenerator.generateResume({
      name,
      email,
      summary: tailoredContent.summary,
      skills: tailoredContent.skills,
      experience: user.masterResumeText.substring(0, 500), // Simplified
    });

    Logger.info('Tailored resume generated', { userId, jobId });

    return {
      pdfUrl: `/temp/${pdfPath.split('/').pop()}`,
      docxUrl: `/temp/${docxPath.split('/').pop()}`,
      telegramMessage: tailoredContent.telegramMessage,
      coverLetter: tailoredContent.coverLetter,
    };
  }

  private buildJobDescription(job: any): string {
    const { parsedData, rawText } = job;
    return `
Job Title: ${parsedData.jobTitle || 'N/A'}
Company: ${parsedData.company || 'N/A'}
Tech Stack: ${parsedData.techStack?.join(', ') || 'N/A'}
Salary: ${parsedData.salary || 'N/A'}
Remote: ${parsedData.isRemote ? 'Yes' : 'No'}
Level: ${parsedData.level || 'N/A'}

Full Description:
${rawText}
    `.trim();
  }
}
