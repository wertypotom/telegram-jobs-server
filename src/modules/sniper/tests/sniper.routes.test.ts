import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import app from '../../../app';
import { JobRepository } from '../../job/job.repository';
import { UserRepository } from '../../user/user.repository';
import { AiTailorService } from '../services/ai-tailor.service';
import { DocxGeneratorService } from '../services/docx-generator.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';

// Mock dependencies
jest.mock('next-auth/jwt');
jest.mock('../services/ai-tailor.service');
jest.mock('../services/pdf-generator.service');
jest.mock('../services/docx-generator.service');

describe('Sniper Routes Integration Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockJobId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue({
      sub: mockUserId,
      email: 'test@example.com',
    });

    // Mock AI Service
    (AiTailorService.prototype.tailorResume as jest.Mock).mockResolvedValue({
      summary: 'Mocked Summary',
      skills: ['Mocked Skill'],
      telegramMessage: 'Mocked Msg',
      coverLetter: 'Mocked Letter',
    });

    // Mock Generators
    (PdfGeneratorService.prototype.generateResume as jest.Mock).mockResolvedValue(
      '/tmp/resume.pdf'
    );
    (DocxGeneratorService.prototype.generateResume as jest.Mock).mockResolvedValue(
      '/tmp/resume.docx'
    );

    // Seed Data
    const userRepo = new UserRepository();
    await userRepo.create({
      _id: mockUserId,
      email: 'test@example.com',
      masterResumeText: 'Master Resume Content',
    } as any);

    const jobRepo = new JobRepository();
    await jobRepo.create({
      _id: mockJobId,
      rawText: 'Job Description',
      channelId: 12345,
      telegramMessageId: 999,
      telegramMessageDate: new Date(),
      parsedData: {
        jobTitle: 'Dev',
        company: 'Corp',
        isRemote: true,
      },
    } as any);
  });

  describe('POST /api/sniper/generate', () => {
    it('should generate tailored resume returning URLs', async () => {
      const response = await request(app).post('/api/sniper/generate').send({ jobId: mockJobId });

      expect(response.status).toBe(200);
      expect(response.body.data.pdfUrl).toBeTruthy();
      expect(response.body.data.docxUrl).toBeTruthy();
      expect(response.body.data.telegramMessage).toBe('Mocked Msg');

      expect(AiTailorService.prototype.tailorResume).toHaveBeenCalled();
    });

    it('should return 400 if user has no master resume', async () => {
      // Update user to remove master resume
      const userRepo = new UserRepository();
      await userRepo.updateById(mockUserId, { masterResumeText: null } as any);

      const response = await request(app).post('/api/sniper/generate').send({ jobId: mockJobId });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toMatch(/upload your master resume/);
    });

    it('should return 404 if job not found', async () => {
      const response = await request(app)
        .post('/api/sniper/generate')
        .send({ jobId: new mongoose.Types.ObjectId().toString() });

      expect(response.status).toBe(404);
    });
  });
});
